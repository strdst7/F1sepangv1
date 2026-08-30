"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn, fmtDuration, fmtViews } from "@/lib/utils";
import { VIDEO_KINDS, type EventItem, type VideoItem } from "@/lib/types";
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
  kind: string;
  durationSec: number;
  url: string;
  thumb: string;
  views: number;
  eventId: string;
};

const SAMPLE_CLIPS: Array<{ label: string; url: string; thumb: string; dur: number }> = [
  {
    label: "Race day edit",
    url: "https://videos.pexels.com/video-files/36062880/15293984_1920_1080_30fps.mp4",
    thumb: "https://images.pexels.com/videos/36062880/pexels-photo-36062880.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    dur: 24,
  },
  {
    label: "Crew push",
    url: "https://videos.pexels.com/video-files/16605635/16605635-uhd_3840_2160_60fps.mp4",
    thumb: "https://images.pexels.com/videos/16605635/pexels-photo-16605635.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    dur: 8,
  },
  {
    label: "Aerial pit lane",
    url: "https://videos.pexels.com/video-files/35818310/15187054_3840_2160_30fps.mp4",
    thumb: "https://images.pexels.com/videos/35818310/pexels-photo-35818310.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    dur: 36,
  },
  {
    label: "Tyre change macro",
    url: "https://videos.pexels.com/video-files/9823146/9823146-hd_1920_1080_25fps.mp4",
    thumb: "https://images.pexels.com/videos/9823146/pexels-photo-9823146.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    dur: 5,
  },
];

const emptyDraft = (): Draft => ({
  title: "",
  kind: "highlight",
  durationSec: 30,
  url: "",
  thumb: "",
  views: 0,
  eventId: "",
});

const toDraft = (v: VideoItem): Draft => ({
  title: v.title,
  kind: v.kind,
  durationSec: v.durationSec,
  url: v.url,
  thumb: v.thumb,
  views: v.views,
  eventId: v.eventId ?? "",
});

export default function VideosPage() {
  const [items, setItems] = useState<VideoItem[] | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; draft: Draft; id?: string } | null>(null);
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const { toast } = useToast();

  useEffect(() => {
    api<{ items: VideoItem[] }>("/api/videos")
      .then((r) => setItems(r.items))
      .catch(() => toast("Could not load the reel.", "err"));
    api<{ items: EventItem[] }>("/api/events")
      .then((r) => setEvents(r.items))
      .catch(() => {});
  }, [toast]);

  useEffect(() => {
    if (window.location.search.includes("new=1")) setModal({ mode: "create", draft: emptyDraft() });
    window.history.replaceState({}, "", "/app/videos");
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const query = q.trim().toLowerCase();
    return items.filter(
      (v) =>
        (kind === "all" || v.kind === kind) &&
        (!query || v.title.toLowerCase().includes(query) || (v.eventLabel ?? "").toLowerCase().includes(query))
    );
  }, [items, q, kind]);

  async function save() {
    if (!modal) return;
    const payload = {
      ...modal.draft,
      durationSec: Number(modal.draft.durationSec) || 30,
      views: Number(modal.draft.views) || 0,
      eventId: modal.draft.eventId || null,
    };
    setBusy(true);
    try {
      if (modal.mode === "create") {
        const res = await api<{ item: VideoItem }>("/api/videos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setItems((prev) => [res.item, ...(prev ?? [])]);
        toast("Cut added to the reel.");
      } else {
        const res = await api<{ item: VideoItem }>(`/api/videos/${modal.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setItems((prev) => (prev ?? []).map((v) => (v.id === res.item.id ? res.item : v)));
        toast("Video updated.");
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
    setItems((prev) => (prev ?? []).filter((v) => v.id !== id));
    api(`/api/videos/${id}`, { method: "DELETE" })
      .then(() => toast("Video cut from the reel."))
      .catch((err) => {
        setItems(snapshot ?? []);
        toast(err instanceof Error ? err.message : "Delete failed — restored.", "err");
      });
    setConfirmId(null);
    setPlaying(null);
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
            placeholder="Search the reel…"
            className={cn(inputCls, "pl-9")}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...Object.keys(VIDEO_KINDS)].map((k) => (
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
              {k === "all" ? "All" : VIDEO_KINDS[k]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal({ mode: "create", draft: emptyDraft() })}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-acid-400 px-4 py-2.5 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300"
        >
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
          New video
        </button>
      </div>

      {/* Grid */}
      {items === null ? (
        <SkGrid n={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="video"
          title={q || kind !== "all" ? "No cuts match" : "The reel is empty"}
          body={
            q || kind !== "all"
              ? "Nothing on the tape matches that search. Try another filter."
              : "Drop your first cut — a highlight edit, a drone pass, a pit-stop ballet."
          }
          actionLabel={q || kind !== "all" ? undefined : "Add a cut"}
          onAction={q || kind !== "all" ? undefined : () => setModal({ mode: "create", draft: emptyDraft() })}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <article
              key={v.id}
              className="glow-card group overflow-hidden rounded-2xl border border-carbon-700 bg-carbon-850"
            >
              <button
                onClick={() => setPlaying(v)}
                className="relative block w-full"
                aria-label={`Play ${v.title}`}
              >
                <img src={v.thumb} alt={v.title} loading="lazy" className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 bg-carbon-950/30 transition group-hover:bg-carbon-950/10" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-ink-100/60 bg-carbon-950/60 text-ink-100 backdrop-blur transition group-hover:scale-110 group-hover:border-acid-400 group-hover:text-acid-400">
                    <Icon name="play" className="h-6 w-6 translate-x-0.5 fill-current" strokeWidth={0} />
                  </span>
                </span>
                <span className="absolute bottom-2.5 right-2.5 rounded-md bg-carbon-950/85 px-2 py-0.5 font-mono text-[10px] text-ink-200">
                  {fmtDuration(v.durationSec)}
                </span>
                <span className="absolute left-2.5 top-2.5">
                  <Chip tone="cyan">{VIDEO_KINDS[v.kind] ?? v.kind}</Chip>
                </span>
              </button>
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-sm font-semibold">{v.title}</h3>
                  <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    <Icon name="eye" className="h-3.5 w-3.5" /> {fmtViews(v.views)} views
                    {v.eventLabel && <span className="truncate normal-case tracking-normal">· {v.eventLabel}</span>}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setModal({ mode: "edit", draft: toDraft(v), id: v.id })}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-carbon-600 text-ink-500 transition hover:border-acid-400/50 hover:text-acid-400"
                    aria-label="Edit video"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(v.id)}
                    className={cn(
                      "grid h-8 place-items-center rounded-lg border px-2 font-mono text-[9px] uppercase transition",
                      confirmId === v.id
                        ? "border-signal-red bg-signal-red/15 text-signal-red"
                        : "w-8 border-carbon-600 text-ink-500 hover:border-signal-red/50 hover:text-signal-red"
                    )}
                    aria-label="Delete video"
                  >
                    {confirmId === v.id ? "Sure?" : <Icon name="trash" className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Player */}
      <Modal open={!!playing} onClose={() => setPlaying(null)} title={playing?.title ?? ""} kicker="Playback deck" wide>
        {playing && (
          <div className="space-y-4">
            <video
              key={playing.id}
              src={playing.url}
              poster={playing.thumb}
              controls
              autoPlay
              playsInline
              className="w-full rounded-xl border border-carbon-700 bg-carbon-950"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="cyan">{VIDEO_KINDS[playing.kind] ?? playing.kind}</Chip>
              {playing.eventLabel && <Chip tone="acid">{playing.eventLabel}</Chip>}
              <Chip>{fmtDuration(playing.durationSec)}</Chip>
              <span className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setModal({ mode: "edit", draft: toDraft(playing), id: playing.id })}
                  className="flex items-center gap-1.5 rounded-lg border border-carbon-600 px-3 py-1.5 font-mono text-xs text-ink-400 transition hover:border-acid-400/50 hover:text-acid-400"
                >
                  <Icon name="pencil" className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => remove(playing.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-carbon-600 px-3 py-1.5 font-mono text-xs text-ink-400 transition hover:border-signal-red/50 hover:text-signal-red"
                >
                  <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                </button>
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / edit */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit cut" : "New cut"}
        kicker={modal?.mode === "edit" ? "Edit bay · edit" : "Edit bay · new"}
      >
        {modal && (
          <div className="space-y-4">
            <Field label="Title">
              <input
                className={inputCls}
                value={modal.draft.title}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, title: e.target.value } })}
                placeholder="Race Day — Full Throttle Edit"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Kind">
                <select
                  className={inputCls}
                  value={modal.draft.kind}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, kind: e.target.value } })}
                >
                  {Object.keys(VIDEO_KINDS).map((k) => (
                    <option key={k} value={k}>{VIDEO_KINDS[k]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Duration (sec)">
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={modal.draft.durationSec}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, durationSec: Number(e.target.value) } })}
                />
              </Field>
              <Field label="Views">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={modal.draft.views}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, views: Number(e.target.value) } })}
                />
              </Field>
            </div>
            <Field label="Video URL (.mp4)">
              <input
                className={inputCls}
                value={modal.draft.url}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, url: e.target.value } })}
                placeholder="https://…"
                required
              />
            </Field>
            <Field label="Thumbnail URL">
              <input
                className={inputCls}
                value={modal.draft.thumb}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, thumb: e.target.value } })}
                placeholder="https://…"
                required
              />
            </Field>
            {modal.mode === "create" && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  Or grab a sample clip
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_CLIPS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() =>
                        setModal({
                          ...modal,
                          draft: { ...modal.draft, url: s.url, thumb: s.thumb, durationSec: s.dur, title: modal.draft.title || s.label },
                        })
                      }
                      className="group overflow-hidden rounded-lg border border-carbon-600 transition hover:border-acid-400/60"
                      aria-label={`Use ${s.label}`}
                    >
                      <img src={s.thumb} alt={s.label} className="h-14 w-full object-cover" loading="lazy" />
                      <span className="block bg-carbon-900 px-1 py-1 text-center font-mono text-[8px] uppercase tracking-wide text-ink-500 group-hover:text-acid-400">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {modal.draft.thumb && (
              <img src={modal.draft.thumb} alt="Thumb preview" className="h-36 w-full rounded-xl border border-carbon-700 object-cover" />
            )}
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
            <div className="flex justify-end gap-2 border-t border-carbon-700 pt-4">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-carbon-600 px-4 py-2 text-sm text-ink-400 transition hover:text-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !modal.draft.title.trim() || !modal.draft.url.trim() || !modal.draft.thumb.trim()}
                className="rounded-lg bg-acid-400 px-5 py-2 font-display text-sm font-semibold text-carbon-950 transition hover:bg-acid-300 disabled:opacity-50"
              >
                {busy ? "Saving…" : modal.mode === "edit" ? "Save changes" : "Add to reel"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
