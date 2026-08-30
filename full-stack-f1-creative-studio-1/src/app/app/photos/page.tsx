"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { PHOTO_CATS, type EventItem, type PhotoItem } from "@/lib/types";
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
  caption: string;
  category: string;
  url: string;
  eventId: string;
};

const SAMPLE_SOURCES = [
  "https://images.pexels.com/photos/29252117/pexels-photo-29252117.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/13857977/pexels-photo-13857977.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/36920241/pexels-photo-36920241.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/11848352/pexels-photo-11848352.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
];

const emptyDraft = (): Draft => ({
  title: "",
  caption: "",
  category: "trackside",
  url: "",
  eventId: "",
});

const toDraft = (p: PhotoItem): Draft => ({
  title: p.title,
  caption: p.caption ?? "",
  category: p.category,
  url: p.url,
  eventId: p.eventId ?? "",
});

export default function PhotosPage() {
  const [items, setItems] = useState<PhotoItem[] | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; draft: Draft; id?: string } | null>(null);
  const [lightbox, setLightbox] = useState<PhotoItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const { toast } = useToast();

  useEffect(() => {
    api<{ items: PhotoItem[] }>("/api/photos")
      .then((r) => setItems(r.items))
      .catch(() => toast("Could not load the photo wall.", "err"));
    api<{ items: EventItem[] }>("/api/events")
      .then((r) => setEvents(r.items))
      .catch(() => {});
  }, [toast]);

  useEffect(() => {
    if (window.location.search.includes("new=1")) setModal({ mode: "create", draft: emptyDraft() });
    window.history.replaceState({}, "", "/app/photos");
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const query = q.trim().toLowerCase();
    return items.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (!query ||
          p.title.toLowerCase().includes(query) ||
          (p.caption ?? "").toLowerCase().includes(query) ||
          (p.eventLabel ?? "").toLowerCase().includes(query))
    );
  }, [items, q, cat]);

  async function save() {
    if (!modal) return;
    const payload = {
      ...modal.draft,
      caption: modal.draft.caption.trim() || null,
      eventId: modal.draft.eventId || null,
    };
    setBusy(true);
    try {
      if (modal.mode === "create") {
        const res = await api<{ item: PhotoItem }>("/api/photos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setItems((prev) => [res.item, ...(prev ?? [])]);
        toast("Frame added to the wall.");
      } else {
        const res = await api<{ item: PhotoItem }>(`/api/photos/${modal.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setItems((prev) => (prev ?? []).map((p) => (p.id === res.item.id ? res.item : p)));
        toast("Photo updated.");
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
    setItems((prev) => (prev ?? []).filter((p) => p.id !== id));
    api(`/api/photos/${id}`, { method: "DELETE" })
      .then(() => toast("Photo removed from the wall."))
      .catch((err) => {
        setItems(snapshot ?? []);
        toast(err instanceof Error ? err.message : "Delete failed — restored.", "err");
      });
    setConfirmId(null);
    setLightbox(null);
  }

  function toggleLike(p: PhotoItem) {
    const nowLiked = !liked.has(p.id);
    const snapshot = items;
    setLiked((prev) => {
      const next = new Set(prev);
      if (nowLiked) next.add(p.id);
      else next.delete(p.id);
      return next;
    });
    setItems((prev) =>
      (prev ?? []).map((x) =>
        x.id === p.id ? { ...x, likes: Math.max(0, x.likes + (nowLiked ? 1 : -1)) } : x
      )
    );
    setLightbox((lb) => (lb && lb.id === p.id ? { ...lb, likes: Math.max(0, lb.likes + (nowLiked ? 1 : -1)) } : lb));
    api(`/api/photos/${p.id}/like`, { method: "POST", body: JSON.stringify({ liked: nowLiked }) })
      .then(() => {})
      .catch((err) => {
        setItems(snapshot ?? []);
        setLiked((prev) => {
          const next = new Set(prev);
          if (nowLiked) next.delete(p.id);
          else next.add(p.id);
          return next;
        });
        toast(err instanceof Error ? err.message : "Like failed.", "err");
      });
  }

  const eventLabel = (id: string | null) => events.find((e) => e.id === id)?.name ?? null;

  return (
    <div className="fade-in space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search frames, captions, events…"
            className={cn(inputCls, "pl-9")}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...Object.keys(PHOTO_CATS)].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition",
                cat === c
                  ? "border-acid-400/60 bg-acid-400/15 text-acid-300"
                  : "border-carbon-600 bg-carbon-850 text-ink-500 hover:text-ink-200"
              )}
            >
              {c === "all" ? "All" : PHOTO_CATS[c]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal({ mode: "create", draft: emptyDraft() })}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-acid-400 px-4 py-2.5 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
        >
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
          New photo
        </button>
      </div>

      {/* Grid */}
      {items === null ? (
        <SkGrid n={9} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="camera"
          title={q || cat !== "all" ? "No frames match" : "The wall is empty"}
          body={
            q || cat !== "all"
              ? "Nothing in the library matches. Loosen the filters and scan again."
              : "Every great race starts with an empty frame. Add your first capture."
          }
          actionLabel={q || cat !== "all" ? undefined : "Add a frame"}
          onAction={q || cat !== "all" ? undefined : () => setModal({ mode: "create", draft: emptyDraft() })}
        />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4">
          {filtered.map((p) => {
            const isLiked = liked.has(p.id);
            return (
              <figure
                key={p.id}
                className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-850"
              >
                <button className="block w-full" onClick={() => setLightbox(p)} aria-label={`Open ${p.title}`}>
                  <img
                    src={p.url}
                    alt={p.title}
                    loading="lazy"
                    className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </button>
                <span className="absolute left-3 top-3">
                  <Chip tone="acid">{PHOTO_CATS[p.category] ?? p.category}</Chip>
                </span>
                {/* hover veil */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon-950/95 via-carbon-950/20 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="font-display text-sm font-semibold">{p.title}</p>
                  {p.caption && <p className="mt-0.5 line-clamp-2 text-xs text-ink-400">{p.caption}</p>}
                  {p.eventLabel && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-acid-400">{p.eventLabel}</p>
                  )}
                </figcaption>
                {/* actions */}
                <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => setModal({ mode: "edit", draft: toDraft(p), id: p.id })}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-carbon-600 bg-carbon-900/80 text-ink-400 backdrop-blur transition hover:border-acid-400/60 hover:text-acid-400"
                    aria-label="Edit photo"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className={cn(
                      "grid h-8 place-items-center rounded-lg border bg-carbon-900/80 px-2 font-mono text-[9px] uppercase backdrop-blur transition",
                      confirmId === p.id
                        ? "border-signal-red bg-signal-red/20 text-signal-red"
                        : "w-8 border-carbon-600 text-ink-400 hover:border-signal-red/60 hover:text-signal-red"
                    )}
                    aria-label="Delete photo"
                  >
                    {confirmId === p.id ? "Sure?" : <Icon name="trash" className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {/* like */}
                <button
                  onClick={() => toggleLike(p)}
                  className={cn(
                    "absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] backdrop-blur transition",
                    isLiked
                      ? "border-signal-red/60 bg-signal-red/20 text-signal-red"
                      : "border-carbon-600 bg-carbon-900/80 text-ink-400 hover:text-ink-100"
                  )}
                  aria-label={isLiked ? "Unlike" : "Like"}
                >
                  <Icon name="heart" className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                  {p.likes}
                </button>
              </figure>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title={lightbox?.title ?? ""} kicker="Lightbox" wide>
        {lightbox && (
          <div className="space-y-4">
            <img src={lightbox.url} alt={lightbox.title} className="w-full rounded-xl border border-carbon-700 object-cover" />
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="acid">{PHOTO_CATS[lightbox.category] ?? lightbox.category}</Chip>
              {lightbox.eventLabel && <Chip tone="cyan">{lightbox.eventLabel}</Chip>}
              <Chip>{timeAgo(lightbox.createdAt)}</Chip>
              <span className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => toggleLike(lightbox)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition",
                    liked.has(lightbox.id)
                      ? "border-signal-red/60 bg-signal-red/15 text-signal-red"
                      : "border-carbon-600 text-ink-400 hover:text-ink-100"
                  )}
                >
                  <Icon name="heart" className={cn("h-4 w-4", liked.has(lightbox.id) && "fill-current")} />
                  {lightbox.likes}
                </button>
                <button
                  onClick={() => setModal({ mode: "edit", draft: toDraft(lightbox), id: lightbox.id })}
                  className="flex items-center gap-1.5 rounded-lg border border-carbon-600 px-3 py-1.5 font-mono text-xs text-ink-400 transition hover:border-acid-400/50 hover:text-acid-400"
                >
                  <Icon name="pencil" className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => remove(lightbox.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-carbon-600 px-3 py-1.5 font-mono text-xs text-ink-400 transition hover:border-signal-red/50 hover:text-signal-red"
                >
                  <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                </button>
              </span>
            </div>
            {lightbox.caption && <p className="text-sm leading-relaxed text-ink-400">{lightbox.caption}</p>}
          </div>
        )}
      </Modal>

      {/* Create / edit modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit frame" : "New frame"}
        kicker={modal?.mode === "edit" ? "Darkroom · edit" : "Darkroom · new"}
      >
        {modal && (
          <div className="space-y-4">
            <Field label="Title">
              <input
                className={inputCls}
                value={modal.draft.title}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, title: e.target.value } })}
                placeholder="Turn 4 dive — brake lights"
                required
              />
            </Field>
            <Field label="Caption" hint="optional">
              <input
                className={inputCls}
                value={modal.draft.caption}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, caption: e.target.value } })}
                placeholder="1/4000 · f/2.8 · ISO 200"
              />
            </Field>
            <Field label="Image URL">
              <input
                className={inputCls}
                value={modal.draft.url}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, url: e.target.value } })}
                placeholder="https://…"
                required
              />
            </Field>
            {modal.mode === "create" && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  Or grab a source frame
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_SOURCES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setModal({ ...modal, draft: { ...modal.draft, url: s } })}
                      className="overflow-hidden rounded-lg border border-carbon-600 transition hover:border-acid-400/60"
                      aria-label="Use sample image"
                    >
                      <img src={s} alt="Sample" className="h-14 w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {modal.draft.url && (
              <img
                src={modal.draft.url}
                alt="Preview"
                className="h-36 w-full rounded-xl border border-carbon-700 object-cover"
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select
                  className={inputCls}
                  value={modal.draft.category}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, category: e.target.value } })}
                >
                  {Object.keys(PHOTO_CATS).map((c) => (
                    <option key={c} value={c}>{PHOTO_CATS[c]}</option>
                  ))}
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
            <div className="flex justify-end gap-2 border-t border-carbon-700 pt-4">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-carbon-600 px-4 py-2 text-sm text-ink-400 transition hover:text-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !modal.draft.title.trim() || !modal.draft.url.trim()}
                className="rounded-lg bg-acid-400 px-5 py-2 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300 disabled:opacity-50"
              >
                {busy ? "Saving…" : modal.mode === "edit" ? "Save changes" : "Add to wall"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
