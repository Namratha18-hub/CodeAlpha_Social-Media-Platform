import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { PostCard, type PostWithMeta } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { fetchPostsWithMeta } from "@/lib/posts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/post/$id")({
  component: PostPage,
});

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: { username: string; display_name: string | null; avatar_url: string | null };
};

function PostPage() {
  const { id } = useParams({ from: "/_authenticated/post/$id" });
  const { user, profile } = useAuth();
  const [post, setPost] = useState<PostWithMeta | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    if (!user) return;
    const arr = await fetchPostsWithMeta({ currentUserId: user.id, ids: [id] });
    if (arr.length === 0) { setNotFound(true); return; }
    setPost(arr[0]);
    const { data: cs } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at, profiles!comments_user_id_fkey(username, display_name, avatar_url)")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setComments(((cs ?? []) as any[]).map((c) => ({
      id: c.id, user_id: c.user_id, content: c.content, created_at: c.created_at,
      author: c.profiles ?? { username: "user", display_name: null, avatar_url: null },
    })));
  }

  useEffect(() => { load(); }, [id, user]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setBusy(true);
    const { error } = await supabase.from("comments").insert({ post_id: id, user_id: user.id, content: text.trim() });
    if (error) toast.error(error.message);
    else { setText(""); load(); }
    setBusy(false);
  }

  async function deleteComment(cid: string) {
    if (!confirm("Delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", cid);
    load();
  }

  if (notFound) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Post not found.</p>
        <Link to="/home" className="mt-3 inline-block text-primary hover:underline">Back to home</Link>
      </div>
    );
  }
  if (!post || !user || !profile) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PostCard post={post} currentUserId={user.id} onChange={load} />

      <form onSubmit={addComment} className="glass rounded-3xl p-4 shadow-soft flex gap-3">
        <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={36} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          maxLength={500}
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <button
          disabled={busy || !text.trim()}
          className="rounded-full bg-gradient-brand px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Reply
        </button>
      </form>

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-4 flex gap-3 group">
            <Avatar url={c.author.avatar_url} name={c.author.display_name || c.author.username} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <Link to={`/u/${c.author.username}`} className="font-semibold hover:underline">
                  {c.author.display_name || c.author.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.content}</p>
            </div>
            {c.user_id === user.id && (
              <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
