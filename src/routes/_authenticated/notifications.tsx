import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Pulse" }] }),
  component: Notifications,
});

type Notif = {
  id: string;
  type: "like" | "comment" | "follow";
  post_id: string | null;
  created_at: string;
  read: boolean;
  actor: { username: string; display_name: string | null; avatar_url: string | null };
};

function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, post_id, created_at, read, profiles!notifications_actor_id_fkey(username, display_name, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems(((data ?? []) as any[]).map((n) => ({
        id: n.id, type: n.type, post_id: n.post_id, created_at: n.created_at, read: n.read,
        actor: n.profiles ?? { username: "user", display_name: null, avatar_url: null },
      })));
      setLoading(false);
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    })();
  }, [user]);

  const icon = {
    like: <Heart className="h-4 w-4 text-accent" />,
    comment: <MessageCircle className="h-4 w-4 text-primary" />,
    follow: <UserPlus className="h-4 w-4 text-primary" />,
  };
  const text = {
    like: "liked your post",
    comment: "commented on your post",
    follow: "started following you",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <h1 className="font-display text-3xl font-bold">Notifications</h1>
      {loading ? (
        <div className="glass rounded-3xl p-10 animate-pulse h-40" />
      ) : items.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
          You're all caught up.
        </div>
      ) : (
        <div className="glass rounded-3xl divide-y overflow-hidden shadow-soft">
          {items.map((n) => {
            const inner = (
              <div className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition">
                <Avatar url={n.actor.avatar_url} name={n.actor.display_name || n.actor.username} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-semibold">{n.actor.display_name || n.actor.username}</span>
                    <span className="text-muted-foreground"> {text[n.type]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div className="shrink-0">{icon[n.type]}</div>
              </div>
            );
            return n.type === "follow" || !n.post_id ? (
              <Link key={n.id} to={`/u/${n.actor.username}`}>{inner}</Link>
            ) : (
              <Link key={n.id} to={`/post/${n.post_id}`}>{inner}</Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
