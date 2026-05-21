import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Avatar } from "@/components/Avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Pulse" }] }),
  component: Settings,
});

function Settings() {
  const { user, profile, reloadProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [dark, setDark] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setUsername(profile.username);
      setBio(profile.bio ?? "");
    }
    setDark(document.documentElement.classList.contains("dark"));
  }, [profile]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }

  async function uploadImage(file: File, kind: "avatar" | "cover") {
    if (!user) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return; }
    const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
    const update = kind === "avatar" ? { avatar_url: url } : { cover_url: url };
    await supabase.from("profiles").update(update).eq("id", user.id);
    reloadProfile();
    toast.success(`${kind === "avatar" ? "Avatar" : "Cover"} updated`);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
      })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile saved"); reloadProfile(); }
    setSaving(false);
  }

  if (!profile) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <section className="glass rounded-3xl p-6 shadow-soft space-y-4">
        <h2 className="font-display text-lg font-bold">Profile photos</h2>
        <div
          className="relative h-40 rounded-2xl bg-gradient-brand cursor-pointer overflow-hidden"
          style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          onClick={() => coverRef.current?.click()}
        >
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 grid place-items-center text-white text-sm">
            <Camera className="h-5 w-5 mr-2 inline" /> Change cover
          </div>
          <input
            ref={coverRef} type="file" accept="image/*" hidden
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")}
          />
        </div>
        <div className="-mt-12 ml-4 inline-block relative cursor-pointer" onClick={() => avatarRef.current?.click()}>
          <div className="rounded-full ring-4 ring-card">
            <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={88} />
          </div>
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 grid place-items-center text-white">
            <Camera className="h-5 w-5" />
          </div>
          <input
            ref={avatarRef} type="file" accept="image/*" hidden
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")}
          />
        </div>
      </section>

      <section className="glass rounded-3xl p-6 shadow-soft space-y-4">
        <h2 className="font-display text-lg font-bold">About</h2>
        <Field label="Display name" value={displayName} onChange={setDisplayName} />
        <Field label="Username" value={username} onChange={setUsername} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">Bio</span>
          <textarea
            value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={280}
            className="w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/40"
          />
        </label>
        <button
          onClick={save} disabled={saving}
          className="rounded-full bg-gradient-brand px-6 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </section>

      <section className="glass rounded-3xl p-6 shadow-soft flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Toggle dark mode</p>
        </div>
        <button
          onClick={toggleDark}
          className={`relative h-7 w-12 rounded-full transition-colors ${dark ? "bg-primary" : "bg-secondary"}`}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-background transition-transform ${dark ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/40"
      />
    </label>
  );
}
