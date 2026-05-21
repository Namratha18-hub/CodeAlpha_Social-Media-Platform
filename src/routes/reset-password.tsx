import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Pulse" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery session from URL hash
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("At least 6 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); navigate({ to: "/home" }); }
    setBusy(false);
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <form onSubmit={submit} className="glass rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-soft">
        <h1 className="font-display text-2xl font-bold">Set a new password</h1>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:ring-2 ring-primary/40"
        />
        <button
          disabled={busy}
          className="w-full rounded-xl bg-gradient-brand py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
