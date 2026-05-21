import { supabase } from "@/integrations/supabase/client";
import type { PostWithMeta } from "@/components/PostCard";

export async function fetchPostsWithMeta(opts: {
  currentUserId: string;
  limit?: number;
  authorId?: string;
  ids?: string[];
}): Promise<PostWithMeta[]> {
  const limit = opts.limit ?? 30;
  let q = supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at, profiles!posts_user_id_fkey(username, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (opts.authorId) q = q.eq("user_id", opts.authorId);
  if (opts.ids) q = q.in("id", opts.ids);

  const { data: posts, error } = await q;
  if (error || !posts) return [];

  const postIds = posts.map((p) => p.id);
  if (postIds.length === 0) return [];

  const [{ data: likes }, { data: myLikes }, { data: comments }] = await Promise.all([
    supabase.from("likes").select("post_id").in("post_id", postIds),
    supabase.from("likes").select("post_id").in("post_id", postIds).eq("user_id", opts.currentUserId),
    supabase.from("comments").select("post_id").in("post_id", postIds),
  ]);

  const likesCount = new Map<string, number>();
  likes?.forEach((l) => likesCount.set(l.post_id, (likesCount.get(l.post_id) ?? 0) + 1));
  const myLikeSet = new Set(myLikes?.map((l) => l.post_id) ?? []);
  const commentsCount = new Map<string, number>();
  comments?.forEach((c) => commentsCount.set(c.post_id, (commentsCount.get(c.post_id) ?? 0) + 1));

  return posts.map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    created_at: p.created_at,
    author: {
      username: p.profiles?.username ?? "user",
      display_name: p.profiles?.display_name ?? null,
      avatar_url: p.profiles?.avatar_url ?? null,
    },
    likes_count: likesCount.get(p.id) ?? 0,
    comments_count: commentsCount.get(p.id) ?? 0,
    liked_by_me: myLikeSet.has(p.id),
  }));
}
