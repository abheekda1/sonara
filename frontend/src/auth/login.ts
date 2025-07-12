import { supabase } from "../util/supabase";

export async function loginWithProvider(
  provider: "github" | "google" | "apple",
) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
  });
  if (error) throw error;
}
