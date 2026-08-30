"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { cn, fmtDuration } from "@/lib/utils";
import { Chip, Icon, Logo, SkGrid } from "@/components/ui";

/* ---------------- motion hooks ---------------- */

function useScramble(text: string, delay = 400) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }
    const chars = "▮/#<>+=~01KD";
    let frame = 0;
    let raf = 0;
    const total = 28;
    const start = performance.now() + delay;
    const tick = (t: number) => {
      if (t < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      frame++;
      const p = Math.min(1, frame / total);
      const revealed = Math.floor(text.length * p);
      let s = text.slice(0, revealed);
      for (let i = revealed; i < text.length; i++)
        s += text[i] === " " ? " " : chars[Math.floor(Math.random() * chars.length)];
      setOut(s);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay]);
  return out;
}

function useCountUp(target: number, ref: React.RefObject<HTMLElement | null>, dur = 1300) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, ref, dur]);
  return n;
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- data ---------------- */

const TICKER = [
  "SELANGOR · MALAYSIA",
  "SEPANG INTERNATIONAL CIRCUIT",
  "5.643 KM",
  "15 CORNERS",
  "MAIN STRAIGHT 1.2 KM",
  "T103",
  "EST. 2019",
  "FANS · VISITORS · CREATORS",
];

const SERVICES = [
  {
    icon: "flag",
    title: "The Moments",
    tag: "Race-day production",
    desc: "Pit walks, autograph sessions, fan events — we design, stage and run the moments of the race weekend so you only have to live them.",
    bullets: ["Full crew + stage rig", "Host & commentary desk", "Same-day highlight drops"],
    img: "https://images.pexels.com/photos/29327965/pexels-photo-29327965.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    href: "/app/events",
    cta: "See live events",
  },
  {
    icon: "camera",
    title: "Photography",
    tag: "48,240 frames and counting",
    desc: "Trackside, pit lane and paddock. Long lenses, low angles, monsoon sessions — your face in the story, delivered in 48 hours.",
    bullets: ["48h delivery, print-ready", "Paddock access shoots", "Fan & family portraits"],
    img: "https://images.pexels.com/photos/29252117/pexels-photo-29252117.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    href: "/app/photos",
    cta: "Open the wall",
  },
  {
    icon: "video",
    title: "Videography",
    tag: "320 reels in the bay",
    desc: "Drone passes over Turns 10–13, 4000fps apex slow-mo, pit-stop ballets in stereo. Cut, graded and ready to post.",
    bullets: ["Drone + ground coverage", "4000fps slow-motion", "Social-ready cuts"],
    img: "https://images.pexels.com/photos/28832062/pexels-photo-28832062.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    href: "/app/videos",
    cta: "Play the reel",
  },
  {
    icon: "sparkles",
    title: "AI Mockup Scenes",
    tag: "912 scenes rendered",
    desc: "Your livery, your number, any weather, any hour. We render cinematic scenes of #39 at Sepang — rain, neon, golden hour.",
    bullets: ["Custom livery & number", "Any weather / hour", "Wall, story & grid formats"],
    img: "/images/mockup-rain.jpg",
    href: "/app/mockups",
    cta: "Queue a scene",
  },
];

const PROCESS = [
  { n: "01", t: "Brief", d: "Tell us the moment you want — a corner, a crew shot, a scene that doesn’t exist yet." },
  { n: "02", t: "Capture", d: "We go to work on circuit: trackside, pit lane, paddock, and 40 metres up." },
  { n: "03", t: "Grade", d: "The darkroom. Colour, sound, and AI scene passes until it hits." },
  { n: "04", t: "Deliver", d: "Your moment on the wall, in your inbox, in 48 hours. Chequered flag." },
];

/* ---------------- sections ---------------- */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-carbon-700 bg-carbon-950/90 backdrop-blur" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink-400 md:flex">
          {[
            ["Services", "#services"],
            ["The Wall", "#wall"],
            ["Process", "#process"],
          ].map(([l, h]) => (
            <a key={h} href={h} className="transition hover:text-acid-400">
              {l}
            </a>
          ))}
          <Link href="/creator" className="font-semibold text-acid-400 transition hover:text-acid-300">
            Free AI Creator
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg border border-carbon-600 px-4 py-2 text-sm font-medium text-ink-200 transition hover:border-acid-400/50 hover:text-acid-400 sm:block"
          >
            Crew login
          </Link>
          <Link
            href="/app"
            className="rounded-lg bg-acid-400 px-4 py-2 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
          >
            Open the studio
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const word = useScramble("MOMENTS", 500);
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/hero.jpg"
          alt="Kracked Devs livery car in the Sepang pit lane at dusk"
          className="kenburns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon-950 via-carbon-950/55 to-carbon-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon-950 via-carbon-950/20 to-carbon-950/40" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-36">
        <p className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-acid-400">
          <span className="h-px w-10 bg-acid-400/70" />
          Sepang · Selangor · Since 2019
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          <span className="block">WE BUILD THE</span>
          <span className="block whitespace-nowrap text-acid-400 [text-shadow:0_0_40px_rgba(163,230,53,0.35)]">
            {word}
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg">
          Kracked Devs is the creative studio for F1 Sepang fans and visitors —
          race-day moments, photography, video and AI-rendered scenes of the
          fastest 5.643 km in Malaysia.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-lg bg-acid-400 px-6 py-3.5 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
          >
            Book a session
            <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.4} />
          </Link>
          <a
            href="#wall"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-100/25 px-6 py-3.5 font-display text-sm font-semibold text-ink-100 backdrop-blur transition hover:border-acid-400/60 hover:text-acid-400"
          >
            <Icon name="camera" className="h-4 w-4" />
            Browse the wall
          </a>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-acid-400 pulse-dot" /> T103 — 312 km/h</span>
          <span>5.643 km circuit</span>
          <span>15 corners</span>
          <span>48h delivery</span>
        </div>
      </div>

      {/* ticker */}
      <div className="marquee-hover relative z-10 border-t border-carbon-700 bg-carbon-950/80 py-3 backdrop-blur">
        <div className="overflow-hidden">
          <div className="animate-marquee flex w-max items-center gap-8 pr-8">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-500">
                {t}
                <Icon name="flag" className="h-3.5 w-3.5 text-acid-400/70" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, suffix, label, sub }: { value: number; suffix?: string; label: string; sub: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const n = useCountUp(value, ref);
  return (
    <div ref={ref} className="group border-l border-carbon-700 pl-5 first:border-0 first:pl-0">
      <p className="font-display text-4xl font-bold tabular-nums text-ink-100 transition group-hover:text-acid-400 sm:text-5xl">
        {n.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-acid-400">{label}</p>
      <p className="mt-1 text-xs text-ink-500">{sub}</p>
    </div>
  );
}

function Stats() {
  return (
    <section className="border-b border-carbon-700 bg-carbon-900">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 lg:grid-cols-4">
        <Stat value={128} label="Race days" sub="Weekends on circuit" />
        <Stat value={48240} label="Frames" sub="Photographs on the wall" />
        <Stat value={320} label="Reels" sub="Cuts in the edit bay" />
        <Stat value={912} label="AI scenes" sub="Rendered by KD Renderer" />
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="relative">
      <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-24">
        <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.35em] text-acid-400">
              // What we run
            </p>
            <h2 className="max-w-xl font-display text-4xl font-bold leading-tight sm:text-5xl">
              Four ways to keep
              <br />
              the <span className="text-acid-400">weekend</span>.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-500">
            One crew, four disciplines. Everything leaves Sepang with a
            watermark, a story, and a delivery in 48 hours.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <article className="glow-card group flex h-full flex-col overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-850">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-carbon-850 via-carbon-950/20 to-transparent" />
                  <span className="absolute bottom-3 left-3">
                    <Chip tone="acid">{s.tag}</Chip>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-acid-400/10 text-acid-400">
                      <Icon name={s.icon} className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">{s.desc}</p>
                  <ul className="mt-4 space-y-1.5">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-ink-500">
                        <Icon name="check" className="h-3.5 w-3.5 text-acid-500" strokeWidth={2.6} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={s.href}
                    className="mt-5 inline-flex items-center gap-1.5 pt-1 font-display text-sm font-semibold text-acid-400 transition group-hover:gap-2.5"
                  >
                    {s.cta}
                    <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.4} />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

type WallItem = { id: string; url: string; title: string; tag: string; ai: boolean };

function Wall() {
  const [wall, setWall] = useState<WallItem[] | null>(null);
  useEffect(() => {
    api<{
      photos: Array<{ id: string; url: string; title: string; category: string }>;
      videos: Array<{ id: string; thumb: string; title: string; durationSec: number; kind: string }>;
      mockups: Array<{ id: string; url: string | null; title: string; style: string }>;
    }>(`/api/gallery`)
      .then((r) => {
        const items: WallItem[] = [
          ...r.photos.map((p) => ({
            id: p.id,
            url: p.url,
            title: p.title,
            tag: p.category,
            ai: false,
          })),
          ...r.videos.map((v) => ({
            id: v.id,
            url: v.thumb,
            title: v.title,
            tag: `video · ${fmtDuration(v.durationSec)}`,
            ai: false,
          })),
          ...r.mockups
            .filter((m) => m.url)
            .map((m) => ({
              id: m.id,
              url: m.url as string,
              title: m.title,
              tag: m.style,
              ai: true,
            })),
        ];
        setWall(items);
      })
      .catch(() => setWall([]));
  }, []);

  return (
    <section id="wall" className="border-y border-carbon-700 bg-carbon-900/60">
      <div className="mx-auto max-w-7xl px-5 py-24">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.35em] text-acid-400">
              // Fresh from the darkroom
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              The wall, <span className="text-acid-400">live</span>.
            </h2>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
            <Chip tone="acid">Real capture</Chip>
            <Chip tone="amber">AI rendered</Chip>
            <span className="ml-2">— pulled straight from the studio database</span>
          </div>
        </Reveal>

        {wall === null ? (
          <SkGrid n={8} />
        ) : wall.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-carbon-600 py-16 text-center">
            <p className="font-display text-lg font-semibold">The wall is warming up</p>
            <p className="mt-2 text-sm text-ink-500">
              Captures land here the moment the studio files them.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {wall.map((w, i) => (
              <figure
                key={w.id}
                className="group relative break-inside-avoid overflow-hidden rounded-xl border border-carbon-700 bg-carbon-850"
                style={{ opacity: 1 }}
              >
                <img
                  src={w.url}
                  alt={w.title}
                  loading="lazy"
                  className={cn(
                    "w-full object-cover transition duration-700 group-hover:scale-[1.05]",
                    i % 3 === 0 ? "aspect-[4/3]" : i % 3 === 1 ? "aspect-[3/4]" : "aspect-square"
                  )}
                />
                <span className="absolute left-2.5 top-2.5">
                  <Chip tone={w.ai ? "amber" : "acid"}>{w.ai ? "AI" : "Real"}</Chip>
                </span>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon-950/90 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3.5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="truncate font-display text-sm font-semibold">{w.title}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-acid-400">{w.tag}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Process() {
  return (
    <section id="process" className="relative overflow-hidden">
      <div className="speedlines absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-24">
        <Reveal className="mb-14">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.35em] text-acid-400">
            // How it works
          </p>
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Brief to chequered flag,
            <br />
            in <span className="text-acid-400">four laps</span>.
          </h2>
        </Reveal>
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-700 sm:grid-cols-2 xl:grid-cols-4">
          {PROCESS.map((p, i) => (
            <li key={p.n} className="group relative bg-carbon-900 p-6 transition hover:bg-carbon-850">
              <Reveal delay={i * 100}>
                <p className="font-display text-5xl font-bold text-carbon-600 transition group-hover:text-acid-400/60">
                  {p.n}
                </p>
                <h3 className="mt-4 font-display text-xl font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.d}</p>
                {i < PROCESS.length - 1 && (
                  <span className="absolute right-4 top-7 hidden xl:block">
                    <Icon name="arrowRight" className="h-5 w-5 text-carbon-500" />
                  </span>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CreatorPromo() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <Reveal>
        <div className="relative grid overflow-hidden rounded-3xl border border-carbon-700 bg-carbon-850 lg:grid-cols-2">
          <div className="relative flex flex-col justify-center p-8 sm:p-12">
            <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.35em] text-acid-400">
              <Icon name="zap" className="h-4 w-4" />
              Free tool · no account needed
            </p>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
              Put yourself
              <br />
              on the <span className="text-acid-400">grid</span>.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-400 sm:text-base">
              The KD AI Creator renders custom creative material in your
              colors — a racing suit, helmet, race car livery or Sepang event
              poster. Your name, your number, free and anonymous.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                "Custom racing suit & helmet renders",
                "F1 livery with your number and sponsor",
                "Free — no account, no signup, download & save",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-ink-300">
                  <Icon name="check" className="h-4 w-4 text-acid-500" strokeWidth={2.6} />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/creator"
                className="group inline-flex items-center gap-2 rounded-lg bg-acid-400 px-6 py-3 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
              >
                Open the AI Creator
                <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.4} />
              </Link>
              <Link
                href="/creator"
                className="inline-flex items-center gap-2 rounded-lg border border-carbon-600 px-5 py-3 font-display text-sm font-semibold text-ink-200 transition hover:border-acid-400/60 hover:text-acid-400"
              >
                Try a sample
              </Link>
            </div>
          </div>
          <div className="relative min-h-[20rem] overflow-hidden border-t border-carbon-700 lg:border-l lg:border-t-0">
            <img
              src="/images/mockup-pit.jpg"
              alt="KD AI creator sample render"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-carbon-950/70 via-transparent to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 rounded-xl border border-carbon-600 bg-carbon-950/80 p-3.5 backdrop-blur">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-acid-400">
                  AI render · racing suit
                </p>
                <p className="mt-0.5 font-display text-sm font-semibold">AINA · #39 · Kracked Devs</p>
              </div>
              <Chip tone="amber">Flux · free</Chip>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Quote() {
  return (
    <section className="relative overflow-hidden border-y border-carbon-700">
      <div className="absolute inset-0">
        <img src="/images/mockup-sunset.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-carbon-950/82" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon-950 via-transparent to-carbon-950" />
      </div>
      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
        <Reveal>
          <Icon name="flag" className="mx-auto h-8 w-8 text-acid-400" />
          <blockquote className="mt-6 font-display text-3xl font-semibold leading-snug sm:text-4xl">
            “I stood in the pit lane with my kids, and that night Kracked Devs
            had the frame on my phone before the paddock lights went out.
            <span className="text-acid-400"> That’s the whole point.</span>”
          </blockquote>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-500">
            — Razman H. · Pit Walk, Race Day
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-acid-400/30 bg-carbon-850 px-6 py-16 text-center sm:px-16">
          <div className="checker-strip absolute inset-x-0 top-0 h-2 opacity-25" aria-hidden />
          <div className="checker-strip absolute inset-x-0 bottom-0 h-2 opacity-25" aria-hidden />
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-acid-400">
            Lights out soon
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">
            Put your name
            <br />
            on the <span className="text-acid-400">wall</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ink-400 sm:text-base">
            No signup, no gate — walk into the studio, plan sessions at Sepang,
            file captures and render AI scenes. Grab a crew badge whenever you
            want one.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-lg bg-acid-400 px-7 py-3.5 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
            >
              Open the studio — free
              <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.4} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-ink-100/25 px-7 py-3.5 font-display text-sm font-semibold text-ink-100 transition hover:border-acid-400/60 hover:text-acid-400"
            >
              Crew login
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-carbon-700 bg-carbon-900">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
              The creative studio for F1 Sepang fans and visitors. We produce
              the moments of the race weekend — and make sure you keep them.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">
              2.95° N, 101.70° E · Selangor, Malaysia
            </p>
          </div>
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">Studio</p>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><a className="transition hover:text-acid-400" href="#services">Services</a></li>
              <li><a className="transition hover:text-acid-400" href="#wall">The Wall</a></li>
              <li><a className="transition hover:text-acid-400" href="#process">Process</a></li>
              <li><Link className="transition hover:text-acid-400" href="/creator">AI Creator (free)</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">Crew</p>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><Link className="transition hover:text-acid-400" href="/login">Crew login</Link></li>
              <li><Link className="transition hover:text-acid-400" href="/app">Open the studio</Link></li>
              <li><Link className="transition hover:text-acid-400" href="/creator">Free AI Creator</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-1.5 border-t border-carbon-700 pt-6 text-center">
          <p className="font-display text-sm font-semibold tracking-wide text-ink-100">
            NUR AMIRAH MOHD KAMIL
          </p>
          <p className="flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-acid-400">
            <span>KD Ambassadors</span>
            <span className="h-1 w-1 rounded-full bg-carbon-600" />
            <span>MI4INC</span>
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-carbon-700 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
          <span>© {new Date().getFullYear()} Kracked Devs Creative</span>
          <span className="flex items-center gap-2">
            <Icon name="zap" className="h-3.5 w-3.5 text-acid-400" />
            Built at Sepang · demo captures via Pexels · AI scenes by KD Renderer
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- page ---------------- */

export default function Landing() {
  return (
    <div className="min-h-screen bg-carbon-950">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Services />
        <Wall />
        <Process />
        <CreatorPromo />
        <Quote />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
