"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn, fmtTime, fromLocalInput, toLocalInput } from "@/lib/utils";
import { EVENT_KINDS, EVENT_STATUS, type EventItem } from "@/lib/types";
import {
  Chip,
  EmptyState,
  Field,
  Icon,
  inputCls,
  Modal,
  ProgressBar,
  SkRows,
  StatusPill,
  useToast,
} from "@/components/ui";

type Draft = {
  name: string;
  date: string; // datetime-local
  kind: string;
  status: string;
  track: string;
  capacity: number;
  reserved: number;
  notes: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  date: toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()),
  kind: "photo-shoot",
  status: "planned",
  track: "Sepang International Circuit",
  capacity: 40,
  reserved: 0,
  notes: "",
});

const toDraft = (e: EventItem): Draft => ({
  name: e.name,
  date: toLocalInput(e.date),
  kind: e.kind,
  status: e.status,
  track: e.track,
  capacity: e.capacity,
  reserved: e.reserved,
  notes: e.notes ?? "",
});

const KINDS = Object.keys(EVENT_KINDS);

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[] | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; draft: Draft; id?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const { toast } = useToast();

  useEffect(() => {
    api<{ items: EventItem[] }>("/api/events")
      .then((r) => setItems(r.items))
      .catch(() => toast("Could not load the event calendar.", "err"));
  }, [toast]);

  useEffect(() => {
    if (window.location.search.includes("new=1")) setModal({ mode: "create", draft: emptyDraft() });
    window.history.replaceState({}, "", "/app/events");
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const query = q.trim().toLowerCase();
    return items.filter(
      (e) =>
        (kind === "all" || e.kind === kind) &&
        (!query ||
          e.name.toLowerCase().includes(query) ||
          e.track.toLowerCase().includes(query))
    );
  }, [items, q, kind]);

  async function save() {
    if (!modal) return;
    const payload = {
      ...modal.draft,
      date: fromLocalInput(modal.draft.date),
      capacity: Number(modal.draft.capacity) || 0,
      reserved: Number(modal.draft.reserved) || 0,
      notes: modal.draft.notes.trim() || null,
    };
    setBusy(true);
    try {
      if (modal.mode === "create") {
        const res = await api<{ item: EventItem }>("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setItems((prev) => [...(prev ?? []), res.item]);
        toast(`“${res.item.name}” is on the calendar.`);
      } else {
        const res = await api<{ item: EventItem }>(`/api/events/${modal.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setItems((prev) => (prev ?? []).map((e) => (e.id === res.item.id ? res.item : e)));
        toast("Event updated.");
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
    const snapshot = items;
    setItems((prev) => (prev ?? []).filter((e) => e.id !== id));
    toast("Event flagged for removal…", "ok");
    api(`/api/events/${id}`, { method: "DELETE" })
      .then(() => toast("Event deleted from the calendar."))
      .catch((err) => {
        setItems(snapshot ?? []);
        toast(err instanceof Error ? err.message : "Delete failed — restored.", "err");
      });
    setConfirmId(null);
  }

  return (
    <div className="fade-in space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
            className={cn(inputCls, "pl-9")}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...KINDS].map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition",
                kind === k
                  ? "border-acid-400/60 bg-acid-400/15 text-acid-300"
                  : "border-carbon-600 bg-carbon-850 text-ink-500 hover:text-ink-200"
              )}
            >
              {k === "all" ? "All" : EVENT_KINDS[k]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal({ mode: "create", draft: emptyDraft() })}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-acid-400 px-4 py-2.5 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
        >
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
          New event
        </button>
      </div>

      {/* List */}
      {items === null ? (
        <SkRows n={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={q || kind !== "all" ? "No sessions match" : "The calendar is empty"}
          body={
            q || kind !== "all"
              ? "Nothing in the paddock matches that search. Try clearing the filters."
              : "Plan your first session at Sepang — a race day, a fan walk, a shoot."
          }
          actionLabel={q || kind !== "all" ? undefined : "Plan a session"}
          onAction={
            q || kind !== "all"
              ? undefined
              : () => setModal({ mode: "create", draft: emptyDraft() })
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((e) => {
            const d = new Date(e.date);
            const past = d.getTime() < Date.now();
            return (
              <li
                key={e.id}
                className="glow-card group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-2xl border border-carbon-700 bg-carbon-850 p-4 sm:grid-cols-[auto_1.4fr_auto_auto_auto_auto]"
              >
                <div className={cn("grid h-14 w-14 place-items-center rounded-xl border text-center", past ? "border-carbon-600 bg-carbon-800" : "border-acid-400/40 bg-acid-400/10")}>
                  <div>
                    <p className={cn("font-display text-xl font-bold leading-none", past ? "text-ink-400" : "text-acid-300")}>
                      {d.getDate()}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-500">
                      {d.toLocaleDateString("en-GB", { month: "short" })}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-semibold">{e.name}</h3>
                    <StatusPill status={e.status} />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-ink-500">
                    {e.track} · {fmtTime(e.date)} · {EVENT_KINDS[e.kind] ?? e.kind}
                  </p>
                  {e.notes && (
                    <p className="mt-1 line-clamp-1 text-xs text-ink-400">{e.notes}</p>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1 sm:w-36">
                  <div className="mb-1 flex justify-between font-mono text-[9px] uppercase tracking-wider text-ink-500">
                    <span>Bookings</span>
                    <span className="text-ink-200">{e.reserved}/{e.capacity}</span>
                  </div>
                  <ProgressBar value={e.reserved} max={e.capacity} tone={past ? "cyan" : "acid"} />
                </div>

                <div className="hidden sm:block">
                  <Chip tone="default">{e.kind}</Chip>
                </div>

                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <button
                    onClick={() => setModal({ mode: "edit", draft: toDraft(e), id: e.id })}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-carbon-600 text-ink-500 transition hover:border-acid-400/50 hover:text-acid-400"
                    aria-label={`Edit ${e.name}`}
                  >
                    <Icon name="pencil" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 font-mono text-[10px] uppercase tracking-wider transition",
                      confirmId === e.id
                        ? "border-signal-red bg-signal-red/15 text-signal-red"
                        : "border-carbon-600 text-ink-500 hover:border-signal-red/50 hover:text-signal-red"
                    )}
                    aria-label={`Delete ${e.name}`}
                  >
                    <Icon name="trash" className="h-4 w-4" />
                    {confirmId === e.id && "Sure?"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create / edit modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit session" : "New session"}
        kicker={modal?.mode === "edit" ? "Pit board · edit" : "Pit board · new"}
      >
        {modal && (
          <div className="space-y-4">
            <Field label="Session name">
              <input
                className={inputCls}
                value={modal.draft.name}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, name: e.target.value } })}
                placeholder="Malaysian GP — Race Day"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date & time">
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={modal.draft.date}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, date: e.target.value } })}
                />
              </Field>
              <Field label="Track">
                <input
                  className={inputCls}
                  value={modal.draft.track}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, track: e.target.value } })}
                />
              </Field>
              <Field label="Kind">
                <select
                  className={inputCls}
                  value={modal.draft.kind}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, kind: e.target.value } })}
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{EVENT_KINDS[k]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  className={inputCls}
                  value={modal.draft.status}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, status: e.target.value } })}
                >
                  {Object.keys(EVENT_STATUS).map((s) => (
                    <option key={s} value={s}>{EVENT_STATUS[s].label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Capacity">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={modal.draft.capacity}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, capacity: Number(e.target.value) } })}
                />
              </Field>
              <Field label="Reserved">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={modal.draft.reserved}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, reserved: Number(e.target.value) } })}
                />
              </Field>
            </div>
            <Field label="Notes" hint="optional">
              <textarea
                rows={3}
                className={cn(inputCls, "resize-none")}
                value={modal.draft.notes}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, notes: e.target.value } })}
                placeholder="Shoot plan, crew assignments, kit checklist…"
              />
            </Field>
            <div className="flex justify-end gap-2 border-t border-carbon-700 pt-4">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-carbon-600 px-4 py-2 text-sm text-ink-400 transition hover:text-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !modal.draft.name.trim() || !modal.draft.date}
                className="rounded-lg bg-acid-400 px-5 py-2 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300 disabled:opacity-50"
              >
                {busy ? "Saving…" : modal.mode === "edit" ? "Save changes" : "Add to calendar"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
