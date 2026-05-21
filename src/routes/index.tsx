import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Users, Image as ImageIcon, Bell, Heart, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero-gradient.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — A modern social network" },
      { name: "description", content: "Share moments, follow creators, and join the conversation on Pulse." },
      { property: "og:title", content: "Pulse — A modern social network" },
      { property: "og:description", content: "Share moments, follow creators, and join the conversation on Pulse." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <img
        src={heroImg}
        alt=""
        width={1920}
        height={1280}
        className="pointer-events-none absolute inset-0 h-[60vh] w-full object-cover opacity-30 dark:opacity-25"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-brand shadow-glow" />
          <span className="font-display text-xl font-bold tracking-tight">Pulse</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/auth"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "register" }}
            className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-glow transition-shadow"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-24">
        <section className="text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            A new way to connect
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
            Share your <span className="text-gradient-brand">pulse</span> with the world
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A modern social platform built for creators. Post, follow, like, and discover — all in
            one beautifully crafted space.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="rounded-full bg-gradient-brand px-7 py-3 text-base font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform"
            >
              Create your profile
            </Link>
            <Link
              to="/auth"
              className="rounded-full glass px-7 py-3 text-base font-semibold hover:bg-card"
            >
              I have an account
            </Link>
          </div>
        </section>

        <section className="mt-28 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: ImageIcon, title: "Rich posts", desc: "Share text and images with a beautiful, distraction-free editor." },
            { icon: Users, title: "Follow anyone", desc: "Build your circle. Get a feed tuned to the people you love." },
            { icon: Heart, title: "Reactions", desc: "Like, comment, and engage with smooth, snappy interactions." },
            { icon: Bell, title: "Live notifications", desc: "Know the second someone likes, comments, or follows you." },
            { icon: MessageCircle, title: "Conversations", desc: "Reply in threads and keep discussions flowing." },
            { icon: Sparkles, title: "Discover", desc: "Find new voices through trending posts and suggested users." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-3xl p-6 shadow-soft hover:shadow-glow transition-shadow">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
