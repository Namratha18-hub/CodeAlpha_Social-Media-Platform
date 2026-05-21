import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Avatar } from "@/components/Avatar";
import { PostCard, type PostWithMeta } from "@/components/PostCard";
import { fetchPostsWithMeta } from "@/lib/posts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/u/$username")({
  component: ProfilePage,
});

type ProfileFull = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
};

function ProfilePage() {
  const { username } = useParams({ from: "/_authenticated/u/$username" });
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, cover_url, created_at")
        .eq("username", username)
        .maybeSingle();
      if (!prof) { setProfile(null); setLoading(false); return; }
      setProfile(prof as ProfileFull);
      const [{ count: fc }, { count: fwc }, { data: rel }, ps] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", prof.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", prof.id),
        supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", prof.id).maybeSingle(),
        fetchPostsWithMeta({ currentUserId: user.id, authorId: prof.id, limit: 30 }),
      ]);
      setFollowers(fc ?? 0); setFollowing(fwc ?? 0);
      setIsFollowing(!!rel);
      setPosts(ps);
      setLoading(false);
    })();
  }, [username, user]);

  async function toggleFollow() {
    if (!user || !profile) return;
    if (isFollowing) {
      setIsFollowing(false); setFollowers((n) => n - 1);
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
    } else {
      setIsFollowing(true); setFollowers((n) => n + 1);
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      if (error) { setIsFollowing(false); setFollowers((n) => n - 1); toast.error(error.message); }
    }
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!profile) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Link to="/home" className="mt-3 inline-block text-primary hover:underline">Back to home</Link>
      </div>
    );
  }
  const isMe = user?.id === profile.id;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div
        className="h-48 sm:h-64 bg-gradient-brand"
        style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="px-4 sm:px-6 -mt-12 relative">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="rounded-full ring-4 ring-background">
            <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={96} />
          </div>
          <div className="mb-2">
            {isMe ? (
              <Link
                to="/settings"
                className="rounded-full glass px-5 py-2 text-sm font-semibold hover:bg-card"
              >
                Edit profile
              </Link>
            ) : (
              <button
                onClick={toggleFollow}
                className={`rounded-full px-5 py-2 text-sm font-semibold ${
                  isFollowing ? "glass" : "bg-gradient-brand text-primary-foreground shadow-soft"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <h1 className="font-display text-2xl font-bold">{profile.display_name || profile.username}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-3 text-[15px] whitespace-pre-wrap">{profile.bio}</p>}
          <div className="mt-3 flex gap-6 text-sm">
            <span><b className="font-semibold">{followers}</b> <span className="text-muted-foreground">Followers</span></span>
            <span><b className="font-semibold">{following}</b> <span className="text-muted-foreground">Following</span></span>
            <span><b className="font-semibold">{posts.length}</b> <span className="text-muted-foreground">Posts</span></span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="font-display text-lg font-bold">Posts</h2>
          {posts.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground">No posts yet.</div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} currentUserId={user!.id} />)
          )}
        </div>
      </div>
    </div>
  );
}
