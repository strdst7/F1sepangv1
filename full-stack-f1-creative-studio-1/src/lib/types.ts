export type EventItem = {
  id: string;
  name: string;
  date: string;
  kind: string;
  status: string;
  track: string;
  capacity: number;
  reserved: number;
  notes: string | null;
  createdAt: string;
};

export type PhotoItem = {
  id: string;
  title: string;
  caption: string | null;
  category: string;
  url: string;
  eventId: string | null;
  eventLabel?: string | null;
  likes: number;
  createdAt: string;
};

export type VideoItem = {
  id: string;
  title: string;
  kind: string;
  durationSec: number;
  url: string;
  thumb: string;
  views: number;
  eventId: string | null;
  eventLabel?: string | null;
  createdAt: string;
};

export type MockupItem = {
  id: string;
  title: string;
  prompt: string;
  style: string;
  aspect: string;
  status: string;
  url: string | null;
  eventId: string | null;
  eventLabel?: string | null;
  createdAt: string;
};

export const EVENT_KINDS: Record<string, string> = {
  "gp-weekend": "GP Weekend",
  "fan-day": "Fan Day",
  "photo-shoot": "Photo Shoot",
  "content-day": "Content Day",
  paddock: "Paddock Access",
};

export const EVENT_STATUS: Record<string, { label: string; tone: string }> = {
  planned: { label: "Planned", tone: "text-signal-cyan border-signal-cyan/40 bg-signal-cyan/10" },
  shooting: { label: "Shooting", tone: "text-signal-amber border-signal-amber/40 bg-signal-amber/10" },
  wrapped: { label: "Wrapped", tone: "text-acid-300 border-acid-400/40 bg-acid-400/10" },
  delivered: { label: "Delivered", tone: "text-ink-400 border-carbon-600 bg-carbon-700/60" },
};

export const PHOTO_CATS: Record<string, string> = {
  trackside: "Trackside",
  "pit-lane": "Pit Lane",
  paddock: "Paddock",
  "fan-moment": "Fan Moment",
  drone: "Drone",
  detail: "Detail",
};

export const VIDEO_KINDS: Record<string, string> = {
  highlight: "Highlight",
  "slow-mo": "Slow-Mo",
  "pit-stop": "Pit Stop",
  drone: "Drone",
  bts: "Behind the Scenes",
};

export const MOCK_STYLES: Record<string, string> = {
  "neon-night": "Neon Night",
  "storm-rain": "Storm Rain",
  "golden-hour": "Golden Hour",
  "pit-lane": "Pit Lane Dusk",
  "kd-creator": "KD Creator",
};

/** Mock render output pool — what the "AI pipeline" returns when ready. */
export const MOCK_OUTPUT_POOL: Record<string, string> = {
  "neon-night": "/images/mockup-pit.jpg",
  "storm-rain": "/images/mockup-rain.jpg",
  "golden-hour": "/images/mockup-sunset.jpg",
  "pit-lane": "/images/hero.jpg",
};

export function toneFor(tone: string) {
  return tone;
}
