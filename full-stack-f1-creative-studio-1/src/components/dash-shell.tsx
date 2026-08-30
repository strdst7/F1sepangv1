"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { cn, initials } from "@/lib/utils";
import { Icon, Logo, ToastProvider } from "./ui";

type NavItem = { href: string; label: string; icon: string; exact?: boolean };
const NAV: Array<{ group: string; items: NavItem[] }> = [
  { group: "Overview", items: [{ href: "/app", label: "Dashboard", icon: "gauge", exact: true }] },
  {
    group: "Content Library",
    items: [
      { href: "/app/events", label: "Race Events", icon: "calendar" },
      { href: "/app/photos", label: "Photos", icon: "camera" },
      { href: "/app/videos", label: "Videos", icon: "video" },
      { href: "/app/mockups", label: "AI Mockups", icon: "sparkles" },
    ],
  },
  {
    group: "Tools",
    items: [
      { href: "/creator", label: "KD AI Creator", icon: "zap" },
    ],
  },
];

function SidebarContent({
  user,
  onNavigate,
}: {
  user: SessionUser | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-carbon-700 px-5 py-5">
        <Link href="/" className="w-fit" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink-500/80">
              {g.group}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.exact
                  ? pathname === it.href
                  : pathname.startsWith(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                        active
                          ? "bg-acid-400/10 font-semibold text-acid-300"
                          : "text-ink-400 hover:bg-carbon-800 hover:text-ink-100"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-acid-400 transition-opacity",
                          active ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Icon
                        name={it.icon}
                        className={cn(
                          "h-[18px] w-[18px] transition-transform group-hover:scale-110",
                          active && "text-acid-400"
                        )}
                      />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="px-3 pt-2">
          <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink-500/80">
            Elsewhere
          </p>
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-400 transition hover:bg-carbon-800 hover:text-ink-100"
          >
            <Icon name="flag" className="h-[18px] w-[18px]" />
            Studio site
          </Link>
        </div>
      </nav>

        <div className="border-t border-carbon-700 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-carbon-700 bg-carbon-800/60 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-acid-400/15 font-display text-xs font-bold text-acid-300">
            {user ? initials(user.name) : "G"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user ? user.name : "Guest"}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-ink-500">
              {user ? user.email : "open studio · no signup"}
            </p>
          </div>
          {user ? (
            <button
              title="Sign out"
              aria-label="Sign out"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } finally {
                  window.location.assign("/login");
                }
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-carbon-600 text-ink-500 transition hover:border-signal-red/50 hover:text-signal-red"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/login"
              title="Crew login"
              aria-label="Crew login"
              onClick={onNavigate}
              className="grid h-8 w-8 place-items-center rounded-lg border border-carbon-600 text-ink-500 transition hover:border-acid-400/50 hover:text-acid-400"
            >
              <Icon name="users" className="h-4 w-4" />
            </Link>
          )}
        </div>
        <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-ink-500/70">
          NUR AMIRAH MOHD KAMIL · KD Ambassadors · MI4INC
        </p>
      </div>
    </div>
  );
}

const TITLES: Array<[string, string, string]> = [
  ["/creator", "KD AI Creator", "Free custom KD renders"],
  ["/app/events", "Race Events", "Plan and track every session on circuit"],
  ["/app/photos", "Photo Library", "Every frame captured at Sepang"],
  ["/app/videos", "Video Library", "Reels, slow-mo and pit-stop ballet"],
  ["/app/mockups", "AI Mockups", "Scene generator — from prompt to wall"],
  ["/app", "Pit Wall", "Live overview of the studio"],
];

export function DashShell({ user, children }: { user: SessionUser | null; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const meta = TITLES.find(([p]) => (p === "/app" ? pathname === "/app" : pathname.startsWith(p)));

  return (
    <ToastProvider>
      <div className="min-h-screen bg-carbon-950">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] border-r border-carbon-700 bg-carbon-900 lg:block">
          <SidebarContent user={user} />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fade-in absolute inset-0 bg-carbon-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="modal-in absolute inset-y-0 left-0 w-[17rem] border-r border-carbon-700 bg-carbon-900">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg border border-carbon-600 text-ink-400"
                aria-label="Close menu"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
              <SidebarContent user={user} onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="lg:pl-[16.5rem]">
          {/* Topbar */}
          <header className="sticky top-0 z-30 border-b border-carbon-700 bg-carbon-950/80 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <button
                onClick={() => setOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-carbon-600 text-ink-400 lg:hidden"
                aria-label="Open menu"
              >
                <Icon name="menu" className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-acid-400">
                  Studio / {meta ? meta[1] : "Sepang"}
                </p>
                <h1 className="truncate font-display text-base font-semibold leading-tight sm:text-lg">
                  {meta ? meta[1] : "Kracked Devs"}
                </h1>
              </div>
              <div className="ml-auto flex items-center gap-3">
                {!user && (
                  <Link
                    href="/login"
                    className="hidden rounded-lg border border-acid-400/50 bg-acid-400/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-acid-300 transition hover:bg-acid-400/20 sm:inline-flex"
                  >
                    Crew login
                  </Link>
                )}
                <span className="hidden items-center gap-2 rounded-lg border border-carbon-700 bg-carbon-850 px-3 py-1.5 font-mono text-[11px] text-ink-400 md:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-acid-400 pulse-dot" />
                  {now
                    ? now.toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })
                    : "SEPANG"}
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold leading-tight">
                    {user ? user.name : "Guest"}
                  </span>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-ink-500">
                    {user ? user.role : "open studio"}
                  </span>
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-acid-400/15 font-display text-sm font-bold text-acid-300">
                  {user ? initials(user.name) : "G"}
                </span>
              </div>
            </div>
            <div className="checker-strip h-1 w-full opacity-15" aria-hidden />
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
