import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { CreatePost } from "@/components/CreatePost";
import { PostCard, type PostWithMeta } from "@/components/PostCard";
import { SuggestedUsers } from "@/components/SuggestedUsers";
import { fetchPostsWithMeta } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — Pulse" }] }),
  component: Home,
});

function Home() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchPostsWithMeta({ currentUserId: user.id, limit: 50 });
    setPosts(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user || !profile) return null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5 min-w-0">
        <h1 className="font-display text-3xl font-bold">Your feed</h1>
        <CreatePost
          userId={user.id}
          avatarUrl={profile.avatar_url}
          name={profile.display_name || profile.username}
          onCreated={load}
        />
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass rounded-3xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
            No posts yet. Be the first to post!
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} currentUserId={user.id} onChange={load} />)
        )}
      </div>
      <aside className="hidden lg:block space-y-5">
        <SuggestedUsers currentUserId={user.id} />
        <div className="glass rounded-3xl p-5 shadow-soft">
          <h3 className="mb-2 font-display text-lg font-bold">Welcome to Pulse</h3>
          <p className="text-sm text-muted-foreground">
            Follow people, share posts, and explore what's trending. Use Explore to find new voices.
          </p>
        </div>
      </aside>
    </div>
  );
}
