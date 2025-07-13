// src/components/Patient/PatientTranscripts.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../util/supabase";

export default function PatientTranscripts() {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<any | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscripts = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile) setFullName(profile.full_name);

      const { data, error } = await supabase
        .from("transcripts")
        .select("id, raw_text, created_at")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTranscripts(data);
      }

      setLoading(false);
    };

    fetchTranscripts();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-white">
        My Transcripts{fullName ? ` for ${fullName}` : ""}
      </h2>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Length</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transcripts.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer hover:bg-gray-700"
                    onClick={() => setSelectedTranscript(t)}
                  >
                    <td>{t.id.slice(0, 8)}</td>
                    <td>{t.raw_text?.length ?? 0} chars</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTranscript && (
            <div className="bg-gray-800 text-gray-200 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">
                Transcript: {selectedTranscript.id.slice(0, 8)}
              </h3>
              <pre className="whitespace-pre-wrap">
                {selectedTranscript.raw_text}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
