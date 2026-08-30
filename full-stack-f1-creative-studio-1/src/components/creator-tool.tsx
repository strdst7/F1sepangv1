"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ASPECTS,
  COLORS,
  DEFAULT_OPTS,
  PRODUCTS,
  SCENES,
  STYLES,
  buildPrompt,
  composeKdImage,
  fallbackMockup,
  kdImageFor,
  randomSeed,
  type CreatorOpts,
} from "@/lib/creator";
import { Chip, Field, Icon, inputCls, Spinner, useToast } from "@/components/ui";

type Gen = {
  seed: number;
  prompt: string;
  url: string;
  source: string;
  fallback: string;
  status: "idle" | "loading" | "ready" | "fallback";
  startedAt: number;
};

type HistEntry = { u: string; p: string; ts: number };

// Keep pre-compositing renders out of the history tray after the cleaner
// lower-third renderer is released.
const HISTORY_KEY = "kd-creator-history-v2";

const LOADING_STEPS = [
  "Loading KD pit assets…",
  "Warming the livery…",
  "Stamping your name…",
  "Adding the number…",
  "Grain & glow pass…",
];

const STAGE_ASPECT: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]",
};

export default function CreatorTool() {
  const [opts, setOpts] = useState<CreatorOpts>(DEFAULT_OPTS);
  const [gen, setGen] = useState<Gen>({
    seed: 0,
    prompt: "",
    url: "",
    source: "",
    fallback: "",
    status: "idle",
    startedAt: 0,
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistEntry[]>([]);
  const { toast } = useToast();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw).slice(0, 4));
    } catch {
      /* ignore */
    }
    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prompt = useMemo(() => buildPrompt(opts), [opts]);

  function clearTimers() {
    if (timer.current) clearTimeout(timer.current);
    if (stepTimer.current) clearInterval(stepTimer.current);
    timer.current = null;
    stepTimer.current = null;
  }

  function set<K extends keyof CreatorOpts>(key: K, value: CreatorOpts[K]) {
    setOpts((o) => ({ ...o, [key]: value }));
  }

  function generate() {
    clearTimers();
    const s = randomSeed();
    const p = buildPrompt(opts);
    const src = kdImageFor(opts);
    // Reuse the last image during the brief render beat so it feels instant.
    setGen((g) => ({
      seed: s,
      prompt: p,
      url: src,
      source: src,
      fallback: fallbackMockup(opts),
      status: "loading",
      startedAt: Date.now(),
    }));
    setStep(0);
    stepTimer.current = setInterval(() => setStep((v) => (v + 1) % LOADING_STEPS.length), 620);
    timer.current = setTimeout(async () => {
      clearTimers();
      try {
        const url = await composeKdImage(opts, s);
        setGen((g) => ({ ...g, url, status: "ready" }));
        const entry: HistEntry = { u: url, p, ts: Date.now() };
        setHistory((h) => {
          const next = [entry, ...h.filter((x) => x.u !== entry.u)].slice(0, 4);
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
        toast("Render complete — that’s the KD look.", "ok");
      } catch {
        setGen((g) => ({ ...g, url: "", status: "fallback" }));
      }
    }, 2600);
  }

  function applyHistory(h: HistEntry) {
    clearTimers();
    setGen((g) => ({ ...g, seed: g.seed, prompt: h.p, url: h.u, source: g.source, status: "ready" }));
  }

  async function saveToWall() {
    setSaving(true);
    try {
      const label = PRODUCTS.find((p) => p.key === opts.product)?.label ?? "KD Creation";
      await api("/api/mockups", {
        method: "POST",
        body: JSON.stringify({
          title: `${(opts.name.trim() || "CREW").toUpperCase()} — ${label}`,
          prompt: gen.prompt,
          style: "kd-creator",
          aspect: opts.aspect,
          status: "ready",
          url: gen.status === "fallback" ? gen.fallback : gen.url,
        }),
      });
      toast("Saved to the studio wall → check AI Mockups.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed.", "err");
    } finally {
      setSaving(false);
    }
  }

  const showFallback = gen.status === "fallback";

  return (
    <div className="grid gap-6 lg:grid-cols-[22.5rem_1fr]">
      {/* ------------ Controls ------------ */}
      <div className="h-fit space-y-5 rounded-2xl border border-carbon-700 bg-carbon-850 p-5 lg:sticky lg:top-24">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">1 · Product</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRODUCTS.map((p) => (
              <button
                key={p.key}
                onClick={() => set("product", p.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition",
                  opts.product === p.key
                    ? "border-acid-400/60 bg-acid-400/10 text-acid-300"
                    : "border-carbon-600 bg-carbon-900 text-ink-400 hover:text-ink-100"
                )}
              >
                <Icon name={p.icon} className="h-4 w-4" />
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
            {PRODUCTS.find((p) => p.key === opts.product)?.blurb}
          </p>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">2 · Colors</p>
          <div className="space-y-3">
            {(["base", "accent"] as const).map((role) => (
              <div key={role}>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-500">
                  {role === "base" ? "Base" : "Accent"} · {COLORS.find((c) => c.key === opts[role])?.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => set(role, c.key)}
                      title={c.label}
                      aria-label={c.label}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg border-2 transition",
                        opts[role] === c.key
                          ? "scale-110 border-ink-100"
                          : "border-carbon-600 hover:scale-105"
                      )}
                      style={{ backgroundColor: c.hex }}
                    >
                      {opts[role] === c.key && (
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">3 · Your name on it</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <input
                className={inputCls}
                value={opts.name}
                maxLength={14}
                onChange={(e) => set("name", e.target.value.toUpperCase())}
                placeholder="AINA"
              />
            </Field>
            <Field label="Number">
              <input
                className={inputCls}
                value={opts.number}
                maxLength={3}
                onChange={(e) => set("number", e.target.value.replace(/\D/g, ""))}
                placeholder="39"
              />
            </Field>
          </div>
          <div className="mt-2">
            <Field label="Sponsor line">
              <input
                className={inputCls}
                value={opts.sponsor}
                maxLength={24}
                onChange={(e) => set("sponsor", e.target.value)}
                placeholder="Kracked Devs"
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Scene">
            <select className={inputCls} value={opts.scene} onChange={(e) => set("scene", e.target.value)}>
              {SCENES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Style">
            <select className={inputCls} value={opts.style} onChange={(e) => set("style", e.target.value)}>
              {STYLES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Format">
            <select className={inputCls} value={opts.aspect} onChange={(e) => set("aspect", e.target.value)}>
              {ASPECTS.map((a) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <div className="flex h-10 w-full items-center justify-center rounded-lg border border-carbon-600 bg-carbon-900 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Free · KD engine
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">4 · KD scene brief</p>
          <div className="max-h-24 overflow-y-auto rounded-lg border border-carbon-600 bg-carbon-900 p-2.5 font-mono text-[10px] leading-relaxed text-ink-500">
            {prompt}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={gen.status === "loading"}
          className={cn(
            "group flex w-full items-center justify-center gap-2 rounded-xl bg-acid-400 px-5 py-3.5 font-display text-sm font-bold text-carbon-950 transition hover:bg-acid-300",
            gen.status === "loading" && "opacity-70"
          )}
        >
          {gen.status === "loading" ? (
            <>
              <Spinner className="h-4 w-4" />
              Rendering…
            </>
          ) : (
            <>
              <Icon name="sparkles" className="h-4.5 w-4.5" strokeWidth={2.2} />
              {gen.status === "idle" ? "Render my KD image" : "Re-render"}
            </>
          )}
        </button>
        <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-ink-500">
          Open web · no account · the KD look, stamped with your name
        </p>
      </div>

      {/* ------------ Stage ------------ */}
      <div className="space-y-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-carbon-850",
            gen.status === "idle" ? "border-dashed border-carbon-600" : "border-carbon-700"
          )}
        >
          {gen.status === "idle" && (
            <div className={cn("grid place-items-center", STAGE_ASPECT[opts.aspect], "min-h-[22rem]")}>
              <div className="text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-carbon-600 bg-carbon-800 text-ink-500">
                  <Icon name="sparkles" className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <p className="mt-4 font-display text-lg font-semibold">The stage is set</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-ink-500">
                  Pick a product — the KD suit, car or grandstand — and put your name on the grid.
                </p>
              </div>
            </div>
          )}

          {gen.status === "loading" && (
            <div className={cn("relative grid place-items-center bg-carbon-900", STAGE_ASPECT[opts.aspect])}>
              <div className="speedlines absolute inset-0" aria-hidden />
              <img
                src={gen.source}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40 blur-[2px]"
              />
              <div className="absolute inset-0 bg-carbon-950/50" />
              <div className="relative text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-acid-400/40 bg-acid-400/10">
                  <Icon name="sparkles" className="h-6 w-6 animate-pulse text-acid-400" />
                </span>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-acid-400">
                  {LOADING_STEPS[step]}
                </p>
                <p className="mt-2 font-mono text-[10px] text-ink-500">
                  seed {gen.seed} · {PRODUCTS.find((p) => p.key === opts.product)?.label} · {opts.aspect}
                </p>
                <button
                  onClick={() => {
                    clearTimers();
                    setGen((g) => ({ ...g, status: "idle" }));
                  }}
                  className="mt-4 rounded-lg border border-carbon-600 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-500 transition hover:text-ink-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {gen.status === "ready" && (
            <div className={cn("relative", STAGE_ASPECT[opts.aspect], "bg-carbon-900")}>
              <img src={gen.url} alt="KD creation" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-carbon-950/90 to-transparent p-4 pt-10">
                <button
                  onClick={generate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-carbon-950/80 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-100 backdrop-blur transition hover:text-acid-400"
                >
                  <Icon name="sparkles" className="h-3.5 w-3.5" /> Re-roll
                </button>
                <a
                  href={gen.url}
                  download="kd-creation.jpg"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-carbon-950/80 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-100 backdrop-blur transition hover:text-acid-400"
                >
                  <Icon name="link" className="h-3.5 w-3.5" /> Download
                </a>
                <button
                  onClick={saveToWall}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-acid-400 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-carbon-950 transition hover:bg-acid-300 disabled:opacity-60"
                >
                  {saving ? "Saving…" : (
                    <>
                      <Icon name="flag" className="h-3.5 w-3.5" strokeWidth={2.2} /> Save to wall
                    </>
                  )}
                </button>
                <Link
                  href="/app/mockups"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-carbon-950/80 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-400 backdrop-blur transition hover:text-acid-400"
                >
                  <Icon name="layers" className="h-3.5 w-3.5" /> Studio wall
                </Link>
              </div>
            </div>
          )}

          {showFallback && (
            <div className={cn("relative", STAGE_ASPECT[opts.aspect], "bg-carbon-900")}>
              <img src={gen.fallback} alt="KD vector mockup" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-carbon-950/90 to-transparent p-4 pt-10">
                <Chip tone="amber">Offline KD render</Chip>
                <button
                  onClick={generate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-carbon-950/80 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-100 backdrop-blur transition hover:text-acid-400"
                >
                  <Icon name="sparkles" className="h-3.5 w-3.5" /> Retry
                </button>
                <button
                  onClick={saveToWall}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-acid-400 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-carbon-950 transition hover:bg-acid-300 disabled:opacity-60"
                >
                  {saving ? "Saving…" : (
                    <>
                      <Icon name="flag" className="h-3.5 w-3.5" strokeWidth={2.2} /> Save to wall
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-carbon-700 bg-carbon-850 p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">
              Your bench — last {history.length} renders
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((h) => (
                <button
                  key={h.ts}
                  onClick={() => applyHistory(h)}
                  className={cn(
                    "shrink-0 overflow-hidden rounded-lg border transition",
                    gen.url === h.u ? "border-acid-400" : "border-carbon-600 hover:border-acid-400/50"
                  )}
                >
                  <img src={h.u} alt="" className="h-16 w-24 object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

        {gen.status !== "idle" && (
          <div className="rounded-2xl border border-carbon-700 bg-carbon-850 p-4">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">
              KD scene brief used
            </p>
            <p className="font-mono text-[11px] leading-relaxed text-ink-400">{gen.prompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}
