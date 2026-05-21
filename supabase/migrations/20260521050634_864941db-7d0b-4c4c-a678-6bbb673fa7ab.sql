
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create index posts_created_at_idx on public.posts(created_at desc);
create index posts_user_id_idx on public.posts(user_id);

create policy "posts are viewable by everyone"
  on public.posts for select using (true);
create policy "auth users can create posts"
  on public.posts for insert with check (auth.uid() = user_id);
create policy "users can update own posts"
  on public.posts for update using (auth.uid() = user_id);
create policy "users can delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- LIKES
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, post_id)
);
alter table public.likes enable row level security;
create index likes_post_id_idx on public.likes(post_id);

create policy "likes viewable by everyone"
  on public.likes for select using (true);
create policy "auth users can like"
  on public.likes for insert with check (auth.uid() = user_id);
create policy "users can unlike own"
  on public.likes for delete using (auth.uid() = user_id);

-- COMMENTS
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create index comments_post_id_idx on public.comments(post_id);

create policy "comments viewable by everyone"
  on public.comments for select using (true);
create policy "auth users can comment"
  on public.comments for insert with check (auth.uid() = user_id);
create policy "users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- FOLLOWS
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;
create index follows_following_idx on public.follows(following_id);

create policy "follows viewable by everyone"
  on public.follows for select using (true);
create policy "users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);
create policy "users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade, -- recipient
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like','comment','follow')),
  post_id uuid references public.posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index notifications_user_idx on public.notifications(user_id, created_at desc);

create policy "users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "auth users can create notifications"
  on public.notifications for insert with check (auth.uid() = actor_id);
create policy "users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- AUTO CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  uname text;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  -- ensure uniqueness
  while exists (select 1 from public.profiles where username = uname) loop
    uname := uname || floor(random()*1000)::text;
  end loop;
  insert into public.profiles (id, username, display_name)
  values (new.id, uname, coalesce(new.raw_user_meta_data->>'display_name', uname));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- AUTO NOTIFICATION TRIGGERS
create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (owner, new.user_id, 'like', new.post_id);
  end if;
  return new;
end; $$;
create trigger on_like_created after insert on public.likes
  for each row execute function public.notify_on_like();

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (owner, new.user_id, 'comment', new.post_id);
  end if;
  return new;
end; $$;
create trigger on_comment_created after insert on public.comments
  for each row execute function public.notify_on_comment();

create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end; $$;
create trigger on_follow_created after insert on public.follows
  for each row execute function public.notify_on_follow();

-- STORAGE BUCKET FOR MEDIA
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;

create policy "media is publicly readable"
  on storage.objects for select using (bucket_id = 'media');
create policy "users can upload to own folder"
  on storage.objects for insert with check (
    bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "users can update own media"
  on storage.objects for update using (
    bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "users can delete own media"
  on storage.objects for delete using (
    bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
  );
