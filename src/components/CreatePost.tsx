import { useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar } from "./Avatar";

export function CreatePost({
  userId, avatarUrl, name, onCreated,
}: {
  userId: string;
  avatarUrl: string | null;
  name: string;
  onCreated: () => void;
}) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    if (!content.trim() && !file) return;
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        image_url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        content: content.trim() || null,
        image_url,
      });
      if (error) throw error;
      setContent(""); pickFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally { setBusy(false); }
  }

  return (
    <div className="glass rounded-3xl p-5 shadow-soft">
      <div className="flex gap-3">
        <Avatar url={avatarUrl} name={name} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            maxLength={2000}
          />
          {preview && (
            <div className="relative mt-2 inline-block">
              <img src={preview} alt="" className="max-h-64 rounded-xl border" />
              <button
                onClick={() => pickFile(null)}
                className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
            >
              <ImageIcon className="h-4 w-4" /> Image
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={submit}
              disabled={busy || (!content.trim() && !file)}
              className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50"
            >
              {busy ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
