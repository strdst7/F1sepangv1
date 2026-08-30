"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Icon, inputCls } from "./ui";

/** Only allow local paths for the post-auth redirect. */
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default function AuthForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fillDemo() {
    setEmail("crew@krackeddevs.com");
    setPassword("kracked2026");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Hard navigation — guarantees the session cookie is sent with the
      // fresh server render of the protected studio.
      window.location.assign(next ?? "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl border border-carbon-600 bg-carbon-800/70 p-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-acid-400">
          <span className="h-1.5 w-1.5 rounded-full bg-acid-400 pulse-dot" />
          Demo crew pass
        </p>
        <div className="grid gap-1 font-mono text-xs text-ink-400">
          <p>
            <span className="text-ink-500">email&nbsp;&nbsp;:</span> crew@krackeddevs.com
          </p>
          <p>
            <span className="text-ink-500">passcode :</span> kracked2026
          </p>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="mt-3 w-full rounded-lg border border-acid-400/50 bg-acid-400/10 px-3 py-2 font-display text-xs font-semibold text-acid-300 transition hover:bg-acid-400/20"
        >
          Fill demo credentials
        </button>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
          Email
        </label>
        <input
          className={inputCls}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@krackeddevs.com"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
          Password
        </label>
        <input
          className={inputCls}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {error && (
        <div className="fade-in flex items-start gap-2 rounded-lg border border-signal-red/40 bg-signal-red/10 px-3 py-2.5 text-sm text-ink-200">
          <Icon name="alert" className="mt-0.5 h-4 w-4 text-signal-red" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className={cn(
          "group flex w-full items-center justify-center gap-2 rounded-lg bg-acid-400 px-4 py-3 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300",
          busy && "opacity-70"
        )}
      >
        {busy ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Starting engine…
          </>
        ) : (
          <>
            Sign in to the studio
            <Icon
              name="arrowRight"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              strokeWidth={2.4}
            />
          </>
        )}
      </button>

      {next && (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
          You’ll be taken to <span className="text-acid-400">{next}</span> after sign in
        </p>
      )}

      <p className="text-center text-xs leading-relaxed text-ink-500">
        No account needed — the studio is open to everyone.
        <br />
        Signing in just adds a crew badge to your sessions.
      </p>
    </form>
  );
}
