import { useEffect, useState } from "react";
import { supabase } from "../../util/supabase";
import { TrashIcon } from "@heroicons/react/20/solid";

interface Props {
  selectedPatient: string | null;
  selectedTranscriptId: string | null;
  setSelectedTranscriptId: (id: string | null) => void;
  refreshKey: number;
}

export default function Dashboard({
  selectedPatient,
  selectedTranscriptId,
  setSelectedTranscriptId,
  refreshKey,
}: Props) {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedPatient) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("patient_id", selectedPatient)
        .order("created_at", { ascending: false });
      if (!error) setTranscripts(data);
      setLoading(false);
    })();
  }, [selectedPatient, refreshKey]);

  useEffect(() => {
    const fetchPatient = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", selectedPatient)
        .single();
      if (!error) setPatient(data);
    };
    fetchPatient();
  }, [selectedPatient]);

  const handleDelete = async (e: React.MouseEvent, transcriptId: string) => {
    e.stopPropagation();

    await supabase.from("sentences").delete().eq("transcript_id", transcriptId);
    await supabase.from("transcripts").delete().eq("id", transcriptId);

    setTranscripts((prev) => prev.filter((t) => t.id !== transcriptId));

    if (selectedTranscriptId === transcriptId) {
      setSelectedTranscriptId(null);
    }
  };

  const current =
    selectedTranscriptId === null
      ? {
          id: "new",
          raw_text: "",
          created_at: new Date().toISOString(),
        }
      : transcripts.find((t) => t.id === selectedTranscriptId);

  const others = transcripts.filter((t) => t.id !== selectedTranscriptId);

  return (
    <div className="p-6">
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">
              Patient Transcripts{" "}
              {patient?.full_name ? `for ${patient.full_name}` : ""}
            </h2>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setSelectedTranscriptId(null)}
              disabled={!selectedPatient}
            >
              + New Transcript
            </button>
          </div>
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Length</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {current && (
                <tr
                  className="bg-base-300 font-semibold"
                  onClick={() =>
                    current.id === "new"
                      ? setSelectedTranscriptId(null)
                      : setSelectedTranscriptId(current.id)
                  }
                >
                  <td>
                    {current.id === "new"
                      ? "New"
                      : `${current.id.slice(0, 8)} (Current)`}
                  </td>
                  <td>
                    {current.raw_text
                      ? `${current.raw_text.length} chars`
                      : "-"}
                  </td>
                  <td>{new Date(current.created_at).toLocaleString()}</td>
                  <td />
                </tr>
              )}

              {others.map((t) => (
                <tr
                  key={t.id}
                  className="group cursor-pointer hover:bg-gray-700"
                  onClick={() => setSelectedTranscriptId(t.id)}
                >
                  <td>{t.id.slice(0, 8)}</td>
                  <td>{t.raw_text.length} chars</td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={(e) => handleDelete(e, t.id)}
                      className="invisible group-hover:visible text-red-500 hover:text-red-700"
                      title="Delete transcript"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
