import { loginWithProvider } from "../auth/login";
import { supabase } from "../util/supabase";
import { useAuth } from "../auth/useAuth";

export default function AuthButton() {
  const session = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center space-x-4">
      {session ? (
        <>
          <span className="text-sm text-gray-400">
            Signed in as{" "}
            <span className="font-medium text-gray-200">
              {session.user.email}
            </span>
          </span>
          <button onClick={handleSignOut} className="btn btn-outline btn-error">
            Sign out
          </button>
        </>
      ) : (
        <button
          onClick={() => loginWithProvider("github")}
          className="btn btn-success"
        >
          Login with GitHub
        </button>
      )}
    </div>
  );
}
