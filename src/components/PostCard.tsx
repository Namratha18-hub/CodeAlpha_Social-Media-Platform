import { useState } from "react";
import { Heart, MessageCircle, Share2, Trash2, MoreHorizontal } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "./Avatar";
import { toast } from "sonner";

export type PostWithMeta = {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
};

export function PostCard({
  post, currentUserId, onChange,
}: { post: PostWithMeta; currentUserId: string; onChange?: () => void }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [count, setCount] = useState(post.likes_count);
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => c + (newLiked ? 1 : -1));
    if (newLiked) {
      const { error } = await supabase.from("likes").insert({ user_id: currentUserId, post_id: post.id });
      if (error) { setLiked(false); setCount((c) => c - 1); }
    } else {
      const { error } = await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", post.id);
      if (error) { setLiked(true); setCount((c) => c + 1); }
    }
    setBusy(false);
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) toast.error(error.message);
    else { toast.success("Post deleted"); onChange?.(); }
  }

  async function sharePost() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: "Pulse post" });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  }

  const mine = post.user_id === currentUserId;

  return (
    <article className="glass rounded-3xl p-5 shadow-soft hover:shadow-glow transition-shadow">
      <header className="flex items-start justify-between gap-3">
        <Link to={`/u/${post.author.username}`} className="flex items-center gap-3 group min-w-0">
          <Avatar url={post.author.avatar_url} name={post.author.display_name || post.author.username} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold group-hover:underline">
              {post.author.display_name || post.author.username}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              @{post.author.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </Link>
        {mine && (
          <button onClick={deletePost} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {post.content && (
        <Link to={`/post/${post.id}`} className="block mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </Link>
      )}

      {post.image_url && (
        <Link to={`/post/${post.id}`} className="mt-3 block overflow-hidden rounded-2xl border">
          <img src={post.image_url} alt="" className="w-full max-h-[520px] object-cover" loading="lazy" />
        </Link>
      )}

      <footer className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
            liked ? "text-accent bg-accent/10" : "hover:bg-secondary"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span className="tabular-nums">{count}</span>
        </button>
        <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-secondary">
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{post.comments_count}</span>
        </Link>
        <button onClick={sharePost} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-secondary">
          <Share2 className="h-4 w-4" />
        </button>
      </footer>
    </article>
  );
}
