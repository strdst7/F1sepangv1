"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import {
  MOCK_OUTPUT_POOL,
  MOCK_STYLES,
  type EventItem,
  type MockupItem,
} from "@/lib/types";
import {
  Chip,
  EmptyState,
  Field,
  Icon,
  inputCls,
  Modal,
  SkGrid,
  useToast,
} from "@/components/ui";

type Draft = {
  title: string;
  prompt: string;
  style: string;
  aspect: string;
  eventId: string;
};

const emptyDraft = (): Draft => ({
  title: "",
  prompt: "",
  style: "neon-night",
  aspect: "16:9",
  eventId: "",
});

const toDraft = (m: MockupItem): Draft => ({
  title: m.title,
  prompt: m.prompt,
  style: m.style,
  aspect: m.aspect,
  eventId: m.eventId ?? "",
});

export default function MockupsPage() {
  const [items, setItems] = useState<MockupItem[] | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; draft: Draft; id?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // The "render pipeline": anything still rendering flips to ready after a short delay.
  const completeRender = (id: string, style: string) => {
    const finish = () => {
      timers.current.delete(id);
      setItems((prev) =>
        (prev ?? []).map((m) =>
          m.id === id && m.status === "rendering"
            ? { ...m, status: "ready", url: MOCK_OUTPUT_POOL[style] ?? MOCK_OUTPUT_POOL["neon-night"] }
            : m
        )
      );
      api(`/api/mockups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ready", url: MOCK_OUTPUT_POOL[style] ?? MOCK_OUTPUT_POOL["neon-night"] }),
      })
        .then(() => toast("Scene rendered and pushed to the wall.", "ok"))
        .catch(() => {});
    };
    const timer = setTimeout(finish, 5200);
    timers.current.set(id, timer);
  };

  useEffect(() => {
    api<{ items: MockupItem[] }>("/api/mockups")
      .then((r) => {
        setItems(r.items);
        r.items
          .filter((m) => m.status === "rendering")
          .forEach((m, i) => completeRender(m.id, m.style));
      })
      .catch(() => toast("Could not load the render queue.", "err"));
    api<{ items: EventItem[] }>("/api/events")
      .then((r) => setEvents(r.items))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.location.search.includes("new=1")) setModal({ mode: "create", draft: emptyDraft() });
    window.history.replaceState({}, "", "/app/mockups");
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const query = q.trim().toLowerCase();
    return items.filter(
      (m) =>
        (status === "all" || m.status === status) &&
        (!query || m.title.toLowerCase().includes(query) || m.prompt.toLowerCase().includes(query))
    );
  }, [items, q, status]);

  async function save() {
    if (!modal) return;
    setBusy(true);
    try {
      if (modal.mode === "create") {
        const payload = {
          ...modal.draft,
          eventId: modal.draft.eventId || null,
        };
        const res = await api<{ item: MockupItem }>("/api/mockups", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setItems((prev) => [res.item, ...(prev ?? [])]);
        toast("Scene queued — the renderer is on it.", "ok");
        completeRender(res.item.id, res.item.style);
      } else {
        const res = await api<{ item: MockupItem }>(`/api/mockups/${modal.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...modal.draft,
            eventId: modal.draft.eventId || null,
          }),
        });
        setItems((prev) => (prev ?? []).map((m) => (m.id === res.item.id ? { ...m, ...res.item } : m)));
        toast("Scene brief updated.");
      }
      setModal(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed.", "err");
    } finally {
      setBusy(false);
    }
  }

  function remove(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 2600);
      return;
    }
    const pending = timers.current.get(id);
    if (pending) clearTimeout(pending);
    timers.current.delete(id);
    const snapshot = items;
    setItems((prev) => (prev ?? []).filter((m) => m.id !== id));
    api(`/api/mockups/${id}`, { method: "DELETE" })
      .then(() => toast("Scene scrapped from the queue."))
      .catch((err) => {
        setItems(snapshot ?? []);
        toast(err instanceof Error ? err.message : "Delete failed — restored.", "err");
      });
    setConfirmId(null);
  }

  const elapsedFor = (iso: string) => {
    const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="fade-in space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scenes, prompts…"
            className={cn(inputCls, "pl-9")}
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "rendering", "ready"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition",
                status === s
                  ? "border-acid-400/60 bg-acid-400/15 text-acid-300"
                  : "border-carbon-600 bg-carbon-850 text-ink-500 hover:text-ink-200"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal({ mode: "create", draft: emptyDraft() })}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-acid-400 px-4 py-2.5 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
        >
          <Icon name="sparkles" className="h-4 w-4" strokeWidth={2.2} />
          Generate scene
        </button>
      </div>

      {/* Grid */}
      {items === null ? (
        <SkGrid n={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="sparkles"
          title={q || status !== "all" ? "No scenes match" : "The render queue is empty"}
          body={
            q || status !== "all"
              ? "Nothing in the queue matches. Loosen the filters."
              : "Describe a scene — a rain-slick Sepang grid, a neon pit at 2 AM — and the studio renders it."
          }
          actionLabel={q || status !== "all" ? undefined : "Generate a scene"}
          onAction={q || status !== "all" ? undefined : () => setModal({ mode: "create", draft: emptyDraft() })}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="glow-card group flex flex-col overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-850"
            >
              <div className="relative aspect-video overflow-hidden bg-carbon-900">
                {m.status === "ready" && m.url ? (
                  <>
                    <img src={m.url} alt={m.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    <span className="absolute left-2.5 top-2.5 flex gap-1.5">
                      <Chip tone="amber">AI</Chip>
                      <Chip>{m.aspect}</Chip>
                    </span>
                  </>
                ) : (
                  <div className="relative h-full w-full">
                    <div className="speedlines absolute inset-0" aria-hidden />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center">
                        <Icon name="sparkles" className="mx-auto h-8 w-8 animate-pulse text-acid-400" />
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-acid-400">
                          Rendering
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-ink-500">
                          {MOCK_STYLES[m.style] ?? m.style} · {m.aspect}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-carbon-800">
                      <div className="render-sweep h-full w-1/3 rounded-full bg-acid-400" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-sm font-semibold">{m.title}</h3>
                  {m.status === "rendering" ? (
                    <Chip tone="amber">
                      <span className="h-1 w-1 rounded-full bg-signal-amber pulse-dot" /> {elapsedFor(m.createdAt)}
                    </Chip>
                  ) : (
                    <Chip tone="acid">Ready</Chip>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-relaxed text-ink-500">
                  “{m.prompt}”
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-carbon-700 pt-3">
                  <Chip tone="cyan">{MOCK_STYLES[m.style] ?? m.style}</Chip>
                  {m.eventLabel && <Chip>{m.eventLabel}</Chip>}
                  <span className="ml-auto flex gap-1.5">
                    {m.status === "ready" && (
                      <button
                        onClick={() => setModal({ mode: "edit", draft: toDraft(m), id: m.id })}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-carbon-600 text-ink-500 transition hover:border-acid-400/50 hover:text-acid-400"
                        aria-label="Edit scene"
                      >
                        <Icon name="pencil" className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(m.id)}
                      className={cn(
                        "grid h-8 place-items-center rounded-lg border px-2 font-mono text-[9px] uppercase transition",
                        confirmId === m.id
                          ? "border-signal-red bg-signal-red/15 text-signal-red"
                          : "w-8 border-carbon-600 text-ink-500 hover:border-signal-red/50 hover:text-signal-red"
                      )}
                      aria-label="Delete scene"
                    >
                      {confirmId === m.id ? "Sure?" : <Icon name="trash" className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / edit */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit scene brief" : "New AI scene"}
        kicker={modal?.mode === "edit" ? "Renderer · brief" : "Renderer · new"}
      >
        {modal && (
          <div className="space-y-4">
            <Field label="Scene title">
              <input
                className={inputCls}
                value={modal.draft.title}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, title: e.target.value } })}
                placeholder="Monsoon push — wet grid"
                required
              />
            </Field>
            <Field label="Scene prompt">
              <textarea
                rows={3}
                className={cn(inputCls, "resize-none font-mono text-xs leading-relaxed")}
                value={modal.draft.prompt}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, prompt: e.target.value } })}
                placeholder="Matte black #39 car with neon lime livery, drifting through a rain-soaked Sepang corner at night, spray catching the floodlights…"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Style preset">
                <select
                  className={inputCls}
                  value={modal.draft.style}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, style: e.target.value } })}
                >
                  {Object.keys(MOCK_STYLES).map((s) => (
                    <option key={s} value={s}>{MOCK_STYLES[s]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Aspect">
                <select
                  className={inputCls}
                  value={modal.draft.aspect}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, aspect: e.target.value } })}
                >
                  <option value="16:9">16:9 · Wall</option>
                  <option value="9:16">9:16 · Story</option>
                  <option value="1:1">1:1 · Grid</option>
                </select>
              </Field>
              <Field label="Event" hint="optional">
                <select
                  className={inputCls}
                  value={modal.draft.eventId}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, eventId: e.target.value } })}
                >
                  <option value="">— No event —</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-carbon-600 bg-carbon-800/60 px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-500">
              <Icon name="zap" className="h-3.5 w-3.5 text-signal-amber" />
              Rendering takes ~5s in the demo pipeline
            </div>
            <div className="flex justify-end gap-2 border-t border-carbon-700 pt-4">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-carbon-600 px-4 py-2 text-sm text-ink-400 transition hover:text-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !modal.draft.title.trim() || !modal.draft.prompt.trim()}
                className="rounded-lg bg-acid-400 px-5 py-2 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300 disabled:opacity-50"
              >
                {busy ? "Queuing…" : modal.mode === "edit" ? "Save brief" : "Queue render"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
