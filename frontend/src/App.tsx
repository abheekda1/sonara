import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Navbar from "./components/Navbar";
import { supabase } from "./util/supabase";
import { useAuth } from "./auth/useAuth";
import Caregiver from "./components/Caregiver";

async function getUserRole() {
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

  useEffect(() => {
    if (!session) return;
    getUserRole().then(setRole);
  }, [session]);

  return (
    <>
      <Navbar />
      {session ? (
        <Caregiver
          fullName={session.user.user_metadata.full_name || "Sonara User"}
          role={role}
        />
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
