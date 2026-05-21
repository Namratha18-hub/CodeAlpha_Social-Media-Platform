import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Avatar } from "@/components/Avatar";
import { PostCard, type PostWithMeta } from "@/components/PostCard";
import { fetchPostsWithMeta } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({ meta: [{ title: "Explore — Pulse" }] }),
  component: Explore,
});

type UserRow = { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null };

function Explore() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [trending, setTrending] = useState<PostWithMeta[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Trending: posts with most likes in last 7 days
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("posts")
        .select("id")
        .gte("created_at", since)
        .limit(100);
      const ids = recent?.map((r) => r.id) ?? [];
      if (ids.length) {
        const { data: likes } = await supabase.from("likes").select("post_id").in("post_id", ids);
        const counts = new Map<string, number>();
        likes?.forEach((l) => counts.set(l.post_id, (counts.get(l.post_id) ?? 0) + 1));
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
        if (top.length) {
          const tposts = await fetchPostsWithMeta({ currentUserId: user.id, ids: top });
          tposts.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
          setTrending(tposts);
        }
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) { setUsers([]); setPosts([]); return; }
      const [{ data: u }, p] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, bio")
          .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
          .limit(10),
        (async () => {
          const { data } = await supabase
            .from("posts")
            .select("id")
            .ilike("content", `%${term}%`)
            .order("created_at", { ascending: false })
            .limit(15);
          const ids = data?.map((r) => r.id) ?? [];
          if (!ids.length) return [];
          return fetchPostsWithMeta({ currentUserId: user.id, ids });
        })(),
      ]);
      setUsers(u ?? []);
      setPosts(p);
    }, 250);
    return () => clearTimeout(t);
  }, [q, user]);

  if (!user) return null;
  const showResults = q.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="font-display text-3xl font-bold">Explore</h1>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people and posts..."
          className="w-full rounded-full border bg-card pl-11 pr-4 py-3 outline-none focus:ring-2 ring-primary/40"
        />
      </div>

      {showResults ? (
        <>
          {users.length > 0 && (
            <section className="glass rounded-3xl p-5 shadow-soft">
              <h2 className="mb-3 font-display text-lg font-bold">People</h2>
              <div className="space-y-3">
                {users.map((u) => (
                  <Link key={u.id} to={`/u/${u.username}`} className="flex items-center gap-3 group">
                    <Avatar url={u.avatar_url} name={u.display_name || u.username} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold group-hover:underline">
                        {u.display_name || u.username}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {posts.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold">Posts</h2>
              {posts.map((p) => <PostCard key={p.id} post={p} currentUserId={user.id} />)}
            </section>
          )}
          {users.length === 0 && posts.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
              No results for "{q}"
            </div>
          )}
        </>
      ) : (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold">Trending this week</h2>
          {trending.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
              Nothing trending yet. Be the spark!
            </div>
          ) : trending.map((p) => <PostCard key={p.id} post={p} currentUserId={user.id} />)}
        </section>
      )}
    </div>
  );
}
