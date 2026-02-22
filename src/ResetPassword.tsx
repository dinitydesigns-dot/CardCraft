import { useEffect, useState } from "react";
import { getSupabaseClient } from "./lib/supabase";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setMsg("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
        setReady(true);
        return;
      }

      // Recovery links you showed are like:
      // http://localhost:5173/#access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";

      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const type = params.get("type");

      if (type !== "recovery") {
        setMsg("Invalid recovery link (missing type=recovery). Please request a new password reset.");
        setReady(true);
        return;
      }

      if (!access_token || !refresh_token) {
        setMsg("Recovery link is missing tokens or has expired. Please request a new password reset.");
        setReady(true);
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        setMsg(error.message);
      }

      setReady(true);
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMsg("Supabase is not configured.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setMsg(error ? error.message : "Password updated. You can now log in with the new password.");
  };

  if (!ready) return <div style={{ padding: 20 }}>Loading…</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Reset password</h2>

      <form onSubmit={onSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit">Set new password</button>
      </form>

      {msg && <p>{msg}</p>}
    </div>
  );
}