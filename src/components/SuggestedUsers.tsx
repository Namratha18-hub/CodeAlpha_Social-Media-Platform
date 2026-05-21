import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "./Avatar";

type Suggestion = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function SuggestedUsers({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<Suggestion[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, [currentUserId]);

  async function load() {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);
    const followingSet = new Set(follows?.map((f) => f.following_id) ?? []);
    const excluded = [...followingSet, currentUserId];
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .not("id", "in", `(${excluded.join(",")})`)
      .limit(5);
    setUsers(data ?? []);
    setFollowingIds(followingSet);
  }

  async function follow(id: string) {
    setFollowingIds((s) => new Set(s).add(id));
    await supabase.from("follows").insert({ follower_id: currentUserId, following_id: id });
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  if (users.length === 0) return null;

  return (
    <div className="glass rounded-3xl p-5 shadow-soft">
      <h3 className="mb-3 font-display text-lg font-bold">Suggested for you</h3>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3">
            <Link to={`/u/${u.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
              <Avatar url={u.avatar_url} name={u.display_name || u.username} size={36} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold group-hover:underline">
                  {u.display_name || u.username}
                </div>
                <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
              </div>
            </Link>
            <button
              onClick={() => follow(u.id)}
              className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background hover:opacity-90"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
