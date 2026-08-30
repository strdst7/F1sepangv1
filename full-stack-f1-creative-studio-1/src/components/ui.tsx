"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { EVENT_STATUS } from "@/lib/types";

/* ---------------- Icons ---------------- */

const paths: Record<string, ReactNode> = {
  gauge: (
    <>
      <path d="M12 15l3.5-5.5" />
      <path d="M20.5 15.5a9 9 0 1 0-17 0" />
      <circle cx="12" cy="15" r="1.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.6" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10.5 21 8v8l-5-2.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 16l.7 1.6L7.3 18l-1.6.7L5 20.3 4.3 18.7 2.7 18l1.6-.4z" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2.5 4L18 12H5" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  pencil: (
    <>
      <path d="M14 5l5 5L8 21H3v-5z" />
      <path d="M12 7l5 5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-9.3-9.1C1.3 7.4 3.6 4.5 6.7 4.5c2 0 3.6 1.1 4.4 2.7l.9 1.7.9-1.7c.8-1.6 2.4-2.7 4.4-2.7 3.1 0 5.4 2.9 4 6.4C19.5 15.4 12 20 12 20z" />
  ),
  play: <path d="M8 5.5v13l11-6.5z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 6.6M17.5 14.7c2 .8 3.2 2.6 3.5 5.3" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  arrowRight: <path d="M4 12h16M13 5l7 7-7 7" />,
  check: <path d="M4 12.5 9.5 18 20 6.5" />,
  alert: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 9.5V14M12 17.2v.1" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4.5 19l5.5-5.5 3 3 4-4 3.5 3.5" />
    </>
  ),
  zap: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5z" />,
  pin: (
    <>
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.6-5.6l-1.7 1.7" />
      <path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.6 5.6l1.7-1.7" />
    </>
  ),
  timer: (
    <>
      <path d="M10 2h4" />
      <circle cx="12" cy="14" r="8" />
      <path d="M12 10v4l2.5 1.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 2.5 8.5 12 14l9.5-5.5z" />
      <path d="M2.5 13.5 12 19l9.5-5.5" />
    </>
  ),
};

export function Icon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: keyof typeof paths | string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      {paths[name] ?? null}
    </svg>
  );
}

/* ---------------- Logo ---------------- */

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-acid-400 bg-carbon-900 font-display text-sm font-bold tracking-tight text-acid-400 shadow-[0_0_18px_-4px_rgba(163,230,53,0.6)]">
        KD
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold leading-none tracking-tight">
          Kracked <span className="text-acid-400">Devs</span>
          <span className="mt-0.5 block font-mono text-[9px] font-normal uppercase tracking-[0.28em] text-ink-500">
            Sepang Creative
          </span>
        </span>
      )}
    </span>
  );
}

/* ---------------- Toasts ---------------- */

type Toast = { id: number; msg: string; type: "ok" | "err" };
type ToastCtx = { toast: (msg: string, type?: "ok" | "err") => void };

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm shadow-2xl backdrop-blur",
              t.type === "ok"
                ? "border-acid-400/40 bg-carbon-800/95 text-ink-100"
                : "border-signal-red/50 bg-carbon-800/95 text-ink-100"
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid h-5 w-5 place-items-center rounded-full",
                t.type === "ok" ? "bg-acid-400/15 text-acid-400" : "bg-signal-red/15 text-signal-red"
              )}
            >
              <Icon name={t.type === "ok" ? "check" : "alert"} className="h-3.5 w-3.5" strokeWidth={2.4} />
            </span>
            <span className="leading-snug">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  kicker,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="fade-in absolute inset-0 bg-carbon-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className={cn(
          "modal-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-carbon-600 bg-carbon-850 shadow-2xl sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-xl"
        )}
      >
        <div className="checker-strip h-1.5 w-full opacity-20" aria-hidden />
        <div className="flex items-center justify-between border-b border-carbon-700 px-5 py-4">
          <div>
            {kicker && (
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-acid-400">
                {kicker}
              </p>
            )}
            <h2 className="font-display text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-carbon-600 text-ink-400 transition hover:border-acid-400/50 hover:text-acid-400"
            aria-label="Close"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="fade-in mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-carbon-600 bg-carbon-850/50 px-8 py-14 text-center">
      <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-carbon-600 bg-carbon-800 text-ink-500">
        <Icon name={icon} className="h-7 w-7" strokeWidth={1.5} />
        <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-carbon-850 bg-acid-400/70" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-500">{body}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 inline-flex items-center gap-2 rounded-lg bg-acid-400 px-4 py-2 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
        >
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ---------------- Skeletons ---------------- */

export function SkBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg bg-carbon-800", className)} />;
}

export function SkGrid({ n = 6, className }: { n?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: n }).map((_, i) => (
        <SkBlock key={i} className={cn("h-52", i % 3 === 1 && "sm:h-64")} />
      ))}
    </div>
  );
}

export function SkRows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <SkBlock key={i} className="h-16" />
      ))}
    </div>
  );
}

/* ---------------- Small atoms ---------------- */

export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "acid" | "cyan" | "amber" | "red";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "border-carbon-600 bg-carbon-800 text-ink-400",
    acid: "border-acid-400/40 bg-acid-400/10 text-acid-300",
    cyan: "border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan",
    amber: "border-signal-amber/40 bg-signal-amber/10 text-signal-amber",
    red: "border-signal-red/40 bg-signal-red/10 text-signal-red",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const meta = EVENT_STATUS[status] ?? EVENT_STATUS.planned;
  const live = status === "shooting";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        meta.tone
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", live && "pulse-dot")} />
      {meta.label}
    </span>
  );
}

export function ProgressBar({ value, max, tone = "acid" }: { value: number; max: number; tone?: "acid" | "cyan" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-carbon-700">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          tone === "acid" ? "bg-acid-400" : "bg-signal-cyan"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ---------------- Form fields ---------------- */

export const inputCls =
  "w-full rounded-lg border border-carbon-600 bg-carbon-900 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500/70 outline-none transition focus:border-acid-400/70 focus:ring-2 focus:ring-acid-400/20 [color-scheme:dark]";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {label}
        </span>
        {hint && <span className="text-[10px] text-ink-500/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4 animate-spin", className)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
