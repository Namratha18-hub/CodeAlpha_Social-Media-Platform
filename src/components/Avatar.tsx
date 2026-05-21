import { Link } from "@tanstack/react-router";

export function Avatar({
  url, name, size = 40, className = "",
}: { url: string | null | undefined; name: string; size?: number; className?: string }) {
  const dim = { width: size, height: size };
  if (url) {
    return <img src={url} alt={name} style={dim} className={`rounded-full object-cover ${className}`} />;
  }
  return (
    <div
      style={dim}
      className={`rounded-full bg-gradient-brand text-primary-foreground grid place-items-center font-bold ${className}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{(name || "?").charAt(0).toUpperCase()}</span>
    </div>
  );
}

export function UserLink({
  username, display_name, avatar_url,
}: { username: string; display_name: string | null; avatar_url: string | null }) {
  return (
    <Link to={`/u/${username}`} className="flex items-center gap-3 group">
      <Avatar url={avatar_url} name={display_name || username} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold group-hover:underline">
          {display_name || username}
        </div>
        <div className="truncate text-xs text-muted-foreground">@{username}</div>
      </div>
    </Link>
  );
}
