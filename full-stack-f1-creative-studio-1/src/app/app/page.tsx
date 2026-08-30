"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { Chip, Icon, ProgressBar, SkBlock, StatusPill } from "@/components/ui";

type Stats = {
  counts: { photos: number; videos: number; mockups: number; events: number };
  week: { photos: number; videos: number; mockups: number; events: number };
  nextEvent: {
    id: string;
    name: string;
    date: string;
    status: string;
    capacity: number;
    reserved: number;
  } | null;
  fallbackEvent: { id: string; name: string; date: string } | null;
  recent: Array<{ type: string; id: string; title: string; url: string; meta: string; date: string }>;
  mix: Array<{ key: string; label: string; n: number }>;
};

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        if (reduce) {
          setN(value);
          return;
        }
        const t0 = performance.now();
        const dur = 1100;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{n}</span>;
}

function useCountdown(target: string | null) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

const TYPE_META: Record<string, { icon: string; label: string; tone: string }> = {
  photo: { icon: "camera", label: "Photo", tone: "text-acid-300 bg-acid-400/10 border-acid-400/30" },
  video: { icon: "video", label: "Video", tone: "text-signal-cyan bg-signal-cyan/10 border-signal-cyan/30" },
  mockup: { icon: "sparkles", label: "AI Scene", tone: "text-signal-amber bg-signal-amber/10 border-signal-amber/30" },
};

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const cd = useCountdown(stats?.nextEvent?.date ?? null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    api<Stats>("/api/stats")
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  const sparkFor = (seed: number) =>
    Array.from({ length: 7 }, (_, i) => {
      const v = Math.abs(Math.sin(seed * 3.7 + i * 1.9)) ;
      return Math.max(0.12, v);
    });

  if (error) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Icon name="alert" className="mx-auto h-10 w-10 text-signal-red" />
        <h2 className="mt-4 font-display text-xl font-semibold">Pit radio static</h2>
        <p className="mt-2 text-sm text-ink-500">
          Couldn’t reach the studio database. Reload to re-connect.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-acid-400 px-4 py-2 font-display text-sm font-semibold text-carbon-950"
        >
          Reload
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <SkBlock className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkBlock key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <SkBlock className="h-72 xl:col-span-2" />
          <SkBlock className="h-72" />
        </div>
      </div>
    );
  }

  const tiles = [
    { key: "photos", label: "Photos on the wall", icon: "camera", tone: "text-acid-300 bg-acid-400/10" },
    { key: "videos", label: "Videos in the reel", icon: "video", tone: "text-signal-cyan bg-signal-cyan/10" },
    { key: "mockups", label: "AI scenes rendered", icon: "sparkles", tone: "text-signal-amber bg-signal-amber/10" },
    { key: "events", label: "Race days run", icon: "flag", tone: "text-ink-200 bg-carbon-700/60" },
  ] as const;

  const mixTotal = Math.max(1, stats.mix.reduce((a, b) => a + b.n, 0));

  return (
    <div className="fade-in space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid-400">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            {greeting}, crew. <span className="text-ink-500">Lights out in</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-carbon-700 bg-carbon-850 px-3 py-2 font-mono text-[11px] text-ink-400">
          <span className="h-1.5 w-1.5 rounded-full bg-acid-400 pulse-dot" />
          STUDIO ONLINE · SEPANG, MY
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t, i) => (
          <div
            key={t.key}
            className="glow-card group rounded-2xl border border-carbon-700 bg-carbon-850 p-5"
          >
            <div className="flex items-start justify-between">
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl", t.tone)}>
                <Icon name={t.icon} className="h-5 w-5" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-acid-400">
                +{stats.week[t.key]} this week
              </span>
            </div>
            <p className="mt-4 font-display text-4xl font-bold tabular-nums">
              <CountUp value={stats.counts[t.key]} />
            </p>
            <p className="mt-1 text-xs text-ink-500">{t.label}</p>
            <div className="mt-4 flex h-8 items-end gap-1">
              {sparkFor(stats.counts[t.key] + i * 13).map((v, j) => (
                <span
                  key={j}
                  className="flex-1 rounded-sm bg-carbon-600 transition-all duration-500 group-hover:bg-acid-400/50"
                  style={{ height: `${Math.round(v * 100)}%`, transitionDelay: `${j * 40}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Next up */}
        <div className="relative overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-850 xl:col-span-2">
          <div className="speedlines absolute inset-0" aria-hidden />
          <div className="relative p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-acid-400">
                <Icon name="timer" className="h-4 w-4" />
                {stats.nextEvent ? "Next up on circuit" : "Season status"}
              </p>
              {stats.nextEvent && <StatusPill status={stats.nextEvent.status} />}
            </div>

            {stats.nextEvent ? (
              <>
                <h3 className="mt-3 font-display text-2xl font-semibold">{stats.nextEvent.name}</h3>
                <p className="mt-1 text-sm text-ink-400">
                  {new Date(stats.nextEvent.date).toLocaleDateString("en-GB", {
                    weekday: "long", day: "2-digit", month: "long",
                  })}{" "}
                  · {new Date(stats.nextEvent.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>

                {cd && (
                  <div className="mt-6 grid max-w-md grid-cols-4 gap-2">
                    {[
                      [cd.d, "DAYS"],
                      [cd.h, "HRS"],
                      [cd.m, "MIN"],
                      [cd.s, "SEC"],
                    ].map(([v, l]) => (
                      <div key={l as string} className="rounded-xl border border-carbon-600 bg-carbon-900/80 px-2 py-3 text-center">
                        <p className="font-display text-2xl font-bold tabular-nums text-acid-300">
                          {String(v).padStart(2, "0")}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] tracking-[0.25em] text-ink-500">{l}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 max-w-md">
                  <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    <span>Paddock bookings</span>
                    <span className="text-ink-200">
                      {stats.nextEvent.reserved}/{stats.nextEvent.capacity}
                    </span>
                  </div>
                  <ProgressBar value={stats.nextEvent.reserved} max={stats.nextEvent.capacity} />
                </div>
              </>
            ) : (
              <div className="mt-4">
                <h3 className="font-display text-2xl font-semibold">Chequered flag — season complete</h3>
                <p className="mt-2 max-w-md text-sm text-ink-400">
                  No future sessions on the calendar yet.
                  {stats.fallbackEvent && (
                    <> Last run: <span className="text-ink-200">{stats.fallbackEvent.name}</span>.</>
                  )}
                </p>
                <Link
                  href="/app/events?new=1"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-acid-400 px-4 py-2 font-display text-sm font-semibold text-carbon-950 hover:bg-acid-300"
                >
                  <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} /> Plan the next session
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions + mix */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-carbon-700 bg-carbon-850 p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
              Quick actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/app/events?new=1", label: "New event", icon: "calendar" },
                { href: "/app/photos?new=1", label: "New photo", icon: "camera" },
                { href: "/app/videos?new=1", label: "New video", icon: "video" },
                { href: "/app/mockups?new=1", label: "New AI scene", icon: "sparkles" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group flex items-center gap-2.5 rounded-xl border border-carbon-600 bg-carbon-800 px-3 py-3 text-xs font-medium text-ink-200 transition hover:border-acid-400/50 hover:bg-acid-400/5 hover:text-acid-300"
                >
                  <Icon name={a.icon} className="h-4 w-4 text-ink-500 transition group-hover:text-acid-400" />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-carbon-700 bg-carbon-850 p-5">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
              Photo wall mix
            </p>
            <div className="space-y-3">
              {stats.mix.slice(0, 5).map((m) => (
                <div key={m.key}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-ink-400">{m.label}</span>
                    <span className="font-mono text-ink-200">{m.n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-carbon-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-acid-500 to-acid-300 transition-all duration-700"
                      style={{ width: `${Math.round((m.n / mixTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent captures */}
      <div className="rounded-2xl border border-carbon-700 bg-carbon-850">
        <div className="flex items-center justify-between border-b border-carbon-700 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
            Recent captures
          </p>
          <Link
            href="/app/photos"
            className="flex items-center gap-1 text-xs font-semibold text-acid-400 hover:text-acid-300"
          >
            Open library <Icon name="arrowRight" className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-500">
            Nothing on the tape yet — head to the library to file your first capture.
          </p>
        ) : (
          <ul className="divide-y divide-carbon-700">
            {stats.recent.map((r) => {
              const meta = TYPE_META[r.type] ?? TYPE_META.photo;
              return (
                <li key={`${r.type}-${r.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-carbon-800/50">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", meta.tone)}>
                    <Icon name={meta.icon} className="h-4 w-4" />
                  </span>
                  {r.url ? (
                    <img src={r.url} alt="" className="h-10 w-14 rounded-md border border-carbon-600 object-cover" loading="lazy" />
                  ) : (
                    <span className="h-10 w-14 rounded-md border border-carbon-600 bg-carbon-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">{meta.label} · {r.meta}</p>
                  </div>
                  <span className="hidden font-mono text-[11px] text-ink-500 sm:block">{timeAgo(r.date)}</span>
                  <Chip tone={r.type === "photo" ? "acid" : r.type === "video" ? "cyan" : "amber"}>
                    {meta.label}
                  </Chip>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
