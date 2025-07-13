// Record.tsx
import { useEffect, useRef, useState } from "react";
import { useDeepgramViaProxy } from "../../hooks/useDeepgramViaProxy";
import { motion } from "motion/react";
import {
  StopIcon,
  MicrophoneIcon,
  ArrowUpOnSquareIcon,
} from "@heroicons/react/20/solid";
import WaveformLive from "../Waveform";
import { supabase } from "../../util/supabase";

interface Props {
  fullName: string;
  role: string | null;
  selectedPatient: string | null;
  setSelectedPatient: (id: string | null) => void;
  selectedTranscriptId: string | null;
  setSelectedTranscriptId: (id: string | null) => void;
  setRefreshKey: (a: (b: number) => number) => void;
}

export default function Record({
  fullName,
  role,
  selectedPatient,
  setSelectedPatient,
  selectedTranscriptId,
  setSelectedTranscriptId,
  setRefreshKey,
}: Props) {
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" }[]
  >([]);
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>(
    [],
  );
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<{ sentence: string; type: string }[]>(
    [],
  );
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tempTranscript = useDeepgramViaProxy(streaming, language);

  useEffect(() => {
    if (selectedTranscriptId === null) {
      setTranscript("");
      setResults([]);
      setElapsed(0);
    }
  }, [selectedTranscriptId]);

  useEffect(() => {
    const fetchPatients = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profile_patients")
        .select("patient:patient_id(id, full_name)")
        .eq("caregiver_id", user.id);

      if (error) {
        console.error("❌ Failed to fetch patients:", error);
        return;
      }

      const cleaned =
        data.map((row) => ({
          id: row.patient.id,
          full_name: row.patient.full_name,
        })) ?? [];

      setPatients(cleaned);
      if (cleaned.length > 0 && !selectedPatient) {
        setSelectedPatient(cleaned[0].id);
      }
    };

    fetchPatients();
  }, [selectedPatient, setSelectedPatient]);

  useEffect(() => {
    if (!tempTranscript?.text) return;
    if (tempTranscript.final) {
      setTranscript((p) => p + " " + tempTranscript.text);
    }
  }, [tempTranscript]);

  useEffect(() => {
    if (streaming) {
      if (!timerRef.current && elapsed < 120) {
        timerRef.current = setInterval(() => {
          setElapsed((prev) => {
            if (prev >= 119) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              setStreaming(false);
              return 120;
            }
            return prev + 0.1;
          });
        }, 100);
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [streaming]);

  useEffect(() => {
    const loadTranscriptForEdit = async () => {
      if (!selectedTranscriptId) return;
      const { data, error } = await supabase
        .from("transcripts")
        .select(
          "id, raw_text, patient_id, sentences(sequence_id, text, category)",
        )
        .eq("id", selectedTranscriptId)
        .single();

      if (error) {
        showToast("Failed to load transcript", "error");
        console.error(error);
        return;
      }

      setTranscript(data.raw_text);
      setSelectedPatient(data.patient_id);
      setResults(
        data.sentences
          .sort((a, b) => a.sequence_id - b.sequence_id)
          .map(({ text, category }) => ({
            sentence: text,
            type: category,
          })),
      );
    };

    loadTranscriptForEdit();
  }, [selectedTranscriptId, setSelectedPatient]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    const id = Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleClassify = async () => {
    setStreaming(false);
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_BACKEND + "/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();

      const newResults = data.classified;

      setResults(newResults);

      // Preserve manual category changes
      // const merged = newResults.map((newItem) => {
      //   const existing = results.find((r) => r.sentence === newItem.sentence);
      //   return {
      //     sentence: newItem.sentence,
      //     type: existing?.type ?? newItem.type, // Keep old type if manually changed
      //   };
      // });

      // setResults(merged);
    } catch (err) {
      console.error("❌ Classification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadTranscript = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not signed in");

      let transcriptId = selectedTranscriptId;

      // Update transcript text if editing
      if (transcriptId) {
        const { error: updateErr } = await supabase
          .from("transcripts")
          .update({ raw_text: transcript })
          .eq("id", transcriptId);
        if (updateErr) throw updateErr;

        const { error: deleteErr } = await supabase
          .from("sentences")
          .delete()
          .eq("transcript_id", transcriptId);
        if (deleteErr) throw deleteErr;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("transcripts")
          .insert({
            caregiver_id: user.id,
            raw_text: transcript,
            patient_id: selectedPatient,
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        transcriptId = inserted.id;
        setSelectedTranscriptId(inserted.id);
      }

      const res = await fetch(import.meta.env.VITE_BACKEND + "/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();

      const newResults = data.classified;

      // Preserve manual category changes
      const merged = newResults.map(
        (newItem: { sentence: string; type: string }) => {
          const existing = results.find((r) => r.sentence === newItem.sentence);
          return {
            sentence: newItem.sentence,
            type: existing?.type ?? newItem.type, // Keep old type if manually changed
          };
        },
      );

      setResults(merged);

      // Always classify latest transcript (even on update)
      const classified = merged;

      const sentencePayload = classified.map(
        (r: { sentence: string; type: string }, i: string) => ({
          transcript_id: transcriptId,
          sequence_id: i,
          text: r.sentence,
          category: r.type,
          manually_changed: false,
        }),
      );

      const { error: sErr } = await supabase
        .from("sentences")
        .insert(sentencePayload);
      if (sErr) throw sErr;

      showToast("Transcript saved successfully!");
    } catch (e) {
      console.error("❌ Upload error:", e);
      showToast("Upload failed. Check console.", "error");
    } finally {
      setLoading(false);
      setRefreshKey((k: number) => k + 1);
    }
  };

  return (
    <div className="p-6">
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl font-bold mb-4 text-gray-400"
      >
        Welcome to Sonara, <p className="text-gray-200">{fullName}</p>
        <p className="text-sm text-gray-700">{role?.toUpperCase()}</p>
      </motion.h1>

      {streaming ? (
        <pre className="bg-gray-800 text-gray-500 p-4 rounded whitespace-pre-wrap">
          {transcript}{" "}
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-gray-100"
          >
            {tempTranscript && !tempTranscript.final ? tempTranscript.text : ""}
          </motion.span>
        </pre>
      ) : (
        <textarea
          className="bg-gray-800 text-gray-100 p-4 rounded w-full"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
      )}

      <div className="flex gap-2 mt-4 flex-wrap">
        <select
          className="select select-sm bg-gray-800 text-white"
          value={selectedPatient ?? ""}
          onChange={(e) => setSelectedPatient(e.target.value)}
        >
          <option disabled value="">
            Choose a patient...
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="select select-sm bg-gray-800 text-white"
        >
          <option value="en-US">English (US)</option>
          <option value="multi">International</option>
        </select>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        <button
          className={`btn ${streaming ? "btn-error" : "btn-success"}`}
          onClick={() => setStreaming((p) => !p)}
        >
          {elapsed > 0 && (
            <span className="text-sm text-gray-700 tabular-nums">
              {Math.floor(elapsed / 60)
                .toString()
                .padStart(2, "0")}
              :
              {Math.floor(elapsed % 60)
                .toString()
                .padStart(2, "0")}
              .{Math.floor((elapsed * 10) % 10)}
            </span>
          )}
          {streaming ? (
            <StopIcon className="h-5 w-5 inline-block" />
          ) : (
            <MicrophoneIcon className="h-5 w-5 inline-block" />
          )}
        </button>

        <button
          className="btn btn-outline"
          onClick={handleClassify}
          disabled={!transcript || streaming || loading}
        >
          {loading ? (
            <span className="loading loading-ring"></span>
          ) : (
            "Classify"
          )}
        </button>

        <button
          className="btn btn-primary"
          onClick={uploadTranscript}
          disabled={!selectedPatient || streaming || loading}
        >
          {loading ? (
            <span className="loading loading-ring"></span>
          ) : (
            <ArrowUpOnSquareIcon className="h-5 w-5 inline-block" />
          )}
        </button>

        {streaming && (
          <div className="h-[40px] overflow-hidden">
            <WaveformLive bars={20} height={40} color="#3b82f6" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map((res, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`outline-1 badge-lg ${res.type.toLowerCase() === "observation" ? "badge-info" : "badge-success"} badge-soft badge-outline inline-block text-white p-0.5 px-2 mb-1 mr-1 rounded-md shadow-md text-left`}
            >
              <div className="flex flex-col gap-1 p-2 rounded-md shadow-sm">
                <select
                  value={res.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setResults(
                      results.map((r, idx) =>
                        idx === i ? { ...r, type: newType } : r,
                      ),
                    );
                  }}
                  className={`select select-xs ${res.type.toLowerCase() === "observation" ? "select-info" : "select-success"} w-fit border focus:outline-none`}
                >
                  <option value="observation">Observation</option>
                  <option value="activity">Activity</option>
                </select>
                <span className="text-sm text-gray-100">{res.sentence}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="toast toast-bottom toast-end z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert ${toast.type === "error" ? "alert-error" : "alert-success"} text-white shadow-lg`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
