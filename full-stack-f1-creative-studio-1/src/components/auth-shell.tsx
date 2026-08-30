import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, Logo } from "./ui";

export function AuthShell({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[46%]">
        <img
          src="/images/hero.jpg"
          alt="Kracked Devs pit scene at Sepang"
          className="kenburns absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon-950/70 via-carbon-950/45 to-carbon-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon-950 via-transparent to-carbon-950/40" />
        <div className="relative z-10 flex w-full flex-col justify-between p-10">
          <Link href="/" className="w-fit">
            <Logo />
          </Link>
          <div>
            <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-acid-400">
              <span className="h-px w-8 bg-acid-400/60" />
              2.95° N, 101.70° E · Sepang
            </p>
            <blockquote className="max-w-md font-display text-3xl font-semibold leading-snug">
              “The race lasts 300 km. The moment you bring home?
              <span className="text-acid-400"> Forever.</span>”
            </blockquote>
            <p className="mt-4 font-mono text-xs text-ink-400">
              — Aina Rahman, Studio Lead, Kracked Devs
            </p>
          </div>
          <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
            <span>EST. 2019</span>
            <span className="h-3 w-px bg-carbon-600" />
            <span>128 RACE DAYS</span>
            <span className="h-3 w-px bg-carbon-600" />
            <span>48K+ FRAMES</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500 transition hover:text-acid-400"
          >
            <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" strokeWidth={2.4} />
            Back to site
          </Link>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-acid-400">
            {kicker}
          </p>
          <h1 className="mb-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-ink-400">{sub}</p>
          <div id="auth-form" className="rounded-2xl border border-carbon-700 bg-carbon-850/80 p-6 shadow-2xl backdrop-blur">
            {children}
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
            <Icon name="flag" className="h-3.5 w-3.5 text-acid-400" />
            Sessions last 7 days · HTTPS · scrypt hashed
          </p>
        </div>
      </div>
    </div>
  );
}
