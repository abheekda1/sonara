import { useEffect, useState } from "react";
import { useDeepgramViaProxy } from "../hooks/useDeepgramViaProxy";
import { motion } from "motion/react";
import { StopIcon, MicrophoneIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/20/solid";
import WaveformLive from "./Waveform";

interface Props {
  fullName: string;
  role: string | null;
}

export default function Record({
  fullName,
  role,
  selectedPatient,
  setSelectedPatient,
}: Props) {
  // export default function Record({ fullName, role }: Props) {
  type ToastItem = { id: number; message: string; type: "success" | "error" };

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<{ sentence: string; type: string }[]>(
    [],
  );
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);

  const tempTranscript = useDeepgramViaProxy(streaming);

  useEffect(() => {
    if (!tempTranscript?.text) return;
    if (tempTranscript?.final) {
      setTranscript((p) => p + " " + tempTranscript?.text);
    }
  }, [tempTranscript]);

  const handleSubmit = async () => {
    setStreaming(false);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      setResults(data.classified);
    } catch (err) {
      console.error("❌ Error submitting:", err);
    } finally {
      setLoading(false);
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
            {tempTranscript &&
              (!tempTranscript.final ? tempTranscript.text : "")}
          </motion.span>
        </pre>
      ) : (
        <textarea
          className="bg-gray-800 text-gray-100 p-4 rounded w-full"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
      )}

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button
          className={`btn ${streaming ? "btn-error" : "btn-success"}`}
          onClick={() => setStreaming((p) => !p)}
        >
          {streaming ? (
            <StopIcon className="h-5 w-5 inline-block" />
          ) : (
            <MicrophoneIcon className="h-5 w-5 inline-block" />
          )}
        </button>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!transcript || streaming || loading}
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
              <div className="flex flex-col gap-1 p-2  rounded-md shadow-sm">
                <select
                  value={res.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    console.log(newType);
                    const updated = results.map((r, idx) =>
                      idx === i ? { ...r, type: newType } : r,
                    );
                    setResults(updated);
                    console.log(updated);
                  }}
                  className={`select select-xs ${res.type.toLowerCase() === "observation" ? "select-info" : "select-success"} w-fit border focus:outline-none focus:ring-2`}
                >
                  <option value="observation">Observation</option>
                  <option value="activity">Activity</option>
                </select>
                <span className="text-sm text-gray-100 leading-relaxed">
                  {res.sentence}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
