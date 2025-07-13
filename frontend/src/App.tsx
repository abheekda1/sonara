import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Navbar from "./components/Navbar";
import { supabase } from "./util/supabase";
import { useAuth } from "./auth/useAuth";
import Record from "./components/Caregiver/Record";
import Dashboard from "./components/Caregiver/Dashboard";
import PatientTranscripts from "./components/Patient/PatientTranscripts";

async function getUserRole(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Failed to fetch role:", error);
    return null;
  }

  return data.role;
}

export default function App() {
  const session = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<
    string | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!session) return;
    getUserRole().then(setRole);
  }, [session]);

  return (
    <>
      <Navbar />
      {session ? (
        <>
          {role === "caregiver" && (
            <>
              <Record
                fullName={session.user.user_metadata.full_name || "Sonara User"}
                role={role}
                selectedPatient={selectedPatient}
                setSelectedPatient={setSelectedPatient}
                selectedTranscriptId={selectedTranscriptId}
                setSelectedTranscriptId={setSelectedTranscriptId}
                setRefreshKey={setRefreshKey}
              />
              <Dashboard
                selectedPatient={selectedPatient}
                selectedTranscriptId={selectedTranscriptId}
                setSelectedTranscriptId={setSelectedTranscriptId}
                refreshKey={refreshKey}
              />
            </>
          )}
          {role === "patient" && <PatientTranscripts />}
          {role === null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 text-gray-400"
            >
              Your account has no role assigned. Please contact support.
            </motion.p>
          )}
        </>
      ) : (
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold mb-4 text-gray-400 p-6"
        >
          Please log in
        </motion.h1>
      )}
    </>
  );
}
