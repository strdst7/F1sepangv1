import type { EventItem, MockupItem, PhotoItem, VideoItem } from "@/lib/types";

/**
 * Read-only demo data used when the optional Postgres connection is unavailable.
 * Keeping this data in the app means a fresh Vercel preview still shows the
 * studio and its local public assets instead of an empty error state.
 */

const daysFromNow = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const image = (name: string) => `/images/${name}`;

export const DEMO_EVENTS: EventItem[] = [
  {
    id: "demo-event-1",
    name: "Malaysian GP — Race Day",
    date: daysFromNow(6, 9),
    kind: "gp-weekend",
    status: "planned",
    track: "Sepang International Circuit",
    capacity: 400,
    reserved: 268,
    notes: "Full crew: trackside pods, drone coverage and a live host desk from the P1 grandstand.",
    createdAt: daysFromNow(-30, 10),
  },
  {
    id: "demo-event-2",
    name: "Fan Pit Walk & Autograph Session",
    date: daysFromNow(5, 15),
    kind: "fan-day",
    status: "planned",
    track: "Sepang International Circuit",
    capacity: 120,
    reserved: 94,
    notes: "Signed helmets, pit-wall photo ops and a priority kids line-up.",
    createdAt: daysFromNow(-25, 10),
  },
  {
    id: "demo-event-3",
    name: "Night Neon Launch — AI Wall Install",
    date: daysFromNow(2, 20),
    kind: "content-day",
    status: "shooting",
    track: "Sepang International Circuit",
    capacity: 150,
    reserved: 77,
    notes: "Neon wall reveal and live AI render demo at the Turn 14 viewing deck.",
    createdAt: daysFromNow(-20, 10),
  },
  {
    id: "demo-event-4",
    name: "Drone Recon — 90° & S2-S3",
    date: daysFromNow(-3, 7),
    kind: "content-day",
    status: "wrapped",
    track: "Sepang International Circuit",
    capacity: 12,
    reserved: 12,
    notes: "Morning light pass for the launch film.",
    createdAt: daysFromNow(-35, 10),
  },
  {
    id: "demo-event-5",
    name: "Paddock Access — Team Hospitality",
    date: daysFromNow(-10, 18),
    kind: "paddock",
    status: "delivered",
    track: "Sepang International Circuit",
    capacity: 60,
    reserved: 48,
    notes: "Cockpit shots, crew portraits and hospitality walk-and-talk.",
    createdAt: daysFromNow(-45, 10),
  },
  {
    id: "demo-event-6",
    name: "Golden Hour Shoot — Main Straight",
    date: daysFromNow(-21, 17),
    kind: "photo-shoot",
    status: "delivered",
    track: "Sepang International Circuit",
    capacity: 30,
    reserved: 30,
    notes: "Long exposure tails and flare through the palms.",
    createdAt: daysFromNow(-55, 10),
  },
  {
    id: "demo-event-7",
    name: "Kids Race Day — Kart Circuit",
    date: daysFromNow(-40, 9),
    kind: "fan-day",
    status: "delivered",
    track: "Sepang International Circuit",
    capacity: 80,
    reserved: 80,
    notes: "Helmet-paint corner, photo booth and a drone circle.",
    createdAt: daysFromNow(-70, 10),
  },
];

const photo = (
  id: string,
  title: string,
  url: string,
  category: string,
  eventId: string,
  likes: number,
  daysAgo: number,
  caption: string
): PhotoItem => ({
  id,
  title,
  url,
  category,
  eventId,
  likes,
  caption,
  createdAt: daysFromNow(-daysAgo, 16),
  eventLabel: DEMO_EVENTS.find((event) => event.id === eventId)?.name ?? null,
});

export const DEMO_PHOTOS: PhotoItem[] = [
  photo("demo-photo-15", "Wet grid, KD car", image("sepang-car-wet.webp"), "trackside", "demo-event-1", 218, 0, "The KD machine cuts through a wet Sepang corner."),
  photo("demo-photo-16", "Three-car formation", image("sepang-grid-race.webp"), "trackside", "demo-event-1", 196, 0, "Three KD cars running together under the Sepang grandstand."),
  photo("demo-photo-17", "Sepang from above", image("sepang-aerial-circuit.webp"), "drone", "demo-event-4", 241, 0, "Aerial pass over the circuit, grandstands and tropical straight."),
  photo("demo-photo-11", "Pit wall briefing", image("pit-wall-briefing.jpeg"), "pit-lane", "demo-event-3", 176, 0, "The KD crew resets between runs in the Sepang pit lane."),
  photo("demo-photo-12", "Crew conversation, garage 7", image("pit-lane-crew.jpeg"), "pit-lane", "demo-event-1", 121, 0, "A quiet moment before the next pit-lane push."),
  photo("demo-photo-13", "Pit radio interview", image("pit-radio-interview.jpeg"), "fan-moment", "demo-event-3", 148, 0, "Live from the garage lane with the KD crew."),
  photo("demo-photo-14", "Golden car, Sepang straight", image("sepang-golden-car.jpeg"), "trackside", "demo-event-6", 204, 0, "Neon lime through the palms at golden hour."),
  photo("demo-photo-1", "Chequered moment, T103", image("hero.jpg"), "trackside", "demo-event-1", 128, 1, "Low angle, floodlights coming up — the KD machine on the line."),
  photo("demo-photo-2", "Monsoon session, full wets", image("mockup-rain.jpg"), "trackside", "demo-event-6", 143, 2, "Sepang rain does what it wants."),
  photo("demo-photo-3", "Neon pit, 2 AM", image("mockup-pit.jpg"), "pit-lane", "demo-event-3", 89, 3, "Mist, neon and a crew still wide awake."),
  photo("demo-photo-4", "Golden straight", image("mockup-sunset.jpg"), "trackside", "demo-event-6", 74, 4, "Warm flare through the palms."),
  photo("demo-photo-5", "KD suit study", image("kd-suit.jpg"), "paddock", "demo-event-5", 112, 5, "Crew portrait from the hospitality walk-through."),
  photo("demo-photo-6", "Grandstand full house", image("kd-grandstand.jpg"), "fan-moment", "demo-event-1", 154, 6, "Forty thousand people, one breath."),
  photo("demo-photo-7", "Crew set, pre-run", image("mockup-pit.jpg"), "pit-lane", "demo-event-1", 67, 7, "Garage seven, five minutes to lights out."),
  photo("demo-photo-8", "Storm over S2", image("mockup-rain.jpg"), "drone", "demo-event-4", 51, 8, "The weather window closes fast in Sepang."),
  photo("demo-photo-9", "Pit walk, row three", image("kd-grandstand.jpg"), "fan-moment", "demo-event-2", 201, 9, "Overhead of the pit-wall crowd."),
  photo("demo-photo-10", "Driver prep", image("kd-suit.jpg"), "detail", "demo-event-5", 92, 10, "Helmet check before paddock entry."),
];

const video = (
  id: string,
  title: string,
  kind: string,
  durationSec: number,
  url: string,
  thumb: string,
  views: number,
  eventId: string,
  daysAgo: number
): VideoItem => ({
  id,
  title,
  kind,
  durationSec,
  url,
  thumb,
  views,
  eventId,
  createdAt: daysFromNow(-daysAgo, 18),
  eventLabel: DEMO_EVENTS.find((event) => event.id === eventId)?.name ?? null,
});

export const DEMO_VIDEOS: VideoItem[] = [
  video("demo-video-1", "Race Day — Full Throttle Edit", "highlight", 24, "https://videos.pexels.com/video-files/36062880/15293984_1920_1080_30fps.mp4", image("hero.jpg"), 2431, "demo-event-1", 1),
  video("demo-video-2", "Apex, 4000 fps", "slow-mo", 6, "https://videos.pexels.com/video-files/36062879/15293954_1920_1080_30fps.mp4", image("mockup-sunset.jpg"), 1876, "demo-event-1", 2),
  video("demo-video-3", "Crew push, garage 7", "pit-stop", 8, "https://videos.pexels.com/video-files/16605635/16605635-uhd_3840_2160_60fps.mp4", image("mockup-pit.jpg"), 954, "demo-event-1", 3),
  video("demo-video-4", "Pit stop choreo, 2.1s", "pit-stop", 10, "https://videos.pexels.com/video-files/16605636/16605636-uhd_3840_2160_60fps.mp4", image("kd-suit.jpg"), 1207, "demo-event-1", 4),
  video("demo-video-5", "Aerial: pit lane ballet", "drone", 36, "https://videos.pexels.com/video-files/35818310/15187054_3840_2160_30fps.mp4", image("kd-grandstand.jpg"), 3012, "demo-event-4", 5),
  video("demo-video-6", "Tyre change, macro", "pit-stop", 5, "https://videos.pexels.com/video-files/9823146/9823146-hd_1920_1080_25fps.mp4", image("mockup-rain.jpg"), 733, "demo-event-5", 6),
  video("demo-video-7", "Wheel gun ballet", "pit-stop", 15, "https://videos.pexels.com/video-files/9737948/9737948-uhd_3840_2160_24fps.mp4", image("mockup-pit.jpg"), 1101, "demo-event-1", 7),
  video("demo-video-8", "Main straight streak", "slow-mo", 6, "https://videos.pexels.com/video-files/18447536/18447536-hd_1920_1080_60fps.mp4", image("mockup-sunset.jpg"), 1588, "demo-event-6", 8),
];

const mockup = (
  id: string,
  title: string,
  prompt: string,
  style: string,
  aspect: string,
  status: string,
  url: string | null,
  eventId: string,
  daysAgo: number
): MockupItem => ({
  id,
  title,
  prompt,
  style,
  aspect,
  status,
  url,
  eventId,
  createdAt: daysFromNow(-daysAgo, 21),
  eventLabel: DEMO_EVENTS.find((event) => event.id === eventId)?.name ?? null,
});

export const DEMO_MOCKUPS: MockupItem[] = [
  mockup("demo-mockup-1", "Livery test — dusk pit", "New livery test mule in the pit lane at dusk, crew in black and acid suits, low hero angle.", "pit-lane", "16:9", "ready", image("hero.jpg"), "demo-event-5", 1),
  mockup("demo-mockup-2", "Monsoon push — wet grid", "Matte black #39 with neon lime livery drifting through a rain-soaked Sepang corner at night.", "storm-rain", "16:9", "ready", image("mockup-rain.jpg"), "demo-event-1", 2),
  mockup("demo-mockup-3", "Neon pit, 2 AM", "Pit lane wrapped in acid-green and violet neon, mist on the asphalt, crew prepping the #39.", "neon-night", "16:9", "ready", image("mockup-pit.jpg"), "demo-event-3", 3),
  mockup("demo-mockup-4", "Golden straight", "Car #39 on the main straight at golden hour, jungle blur and warm flare through the palms.", "golden-hour", "16:9", "ready", image("mockup-sunset.jpg"), "demo-event-6", 4),
  mockup("demo-mockup-5", "Launch week hero — wet grid", "Hero frame for launch week: wet grid at dawn, #39 on pole, rain mist and acid-green livery.", "storm-rain", "16:9", "rendering", null, "demo-event-3", 1),
  mockup("demo-mockup-6", "Night launch — neon wall", "Vertical shot of the neon install at the Turn 14 viewing deck with crowd silhouettes.", "neon-night", "9:16", "rendering", null, "demo-event-3", 2),
];

export function getDemoStats() {
  const recent = [
    ...DEMO_PHOTOS.map((item) => ({ type: "photo", id: item.id, title: item.title, url: item.url, meta: item.category, date: item.createdAt })),
    ...DEMO_VIDEOS.map((item) => ({ type: "video", id: item.id, title: item.title, url: item.thumb, meta: item.kind, date: item.createdAt })),
    ...DEMO_MOCKUPS.filter((item) => item.status === "ready").map((item) => ({ type: "mockup", id: item.id, title: item.title, url: item.url ?? "", meta: item.style, date: item.createdAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  const mix = ["trackside", "pit-lane", "paddock", "fan-moment", "drone", "detail"].map((key) => ({
    key,
    label: key.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    n: DEMO_PHOTOS.filter((item) => item.category === key).length,
  }));

  return {
    counts: {
      photos: DEMO_PHOTOS.length,
      videos: DEMO_VIDEOS.length,
      mockups: DEMO_MOCKUPS.length,
      events: DEMO_EVENTS.length,
    },
    week: { photos: 6, videos: 4, mockups: 4, events: 3 },
    nextEvent: DEMO_EVENTS.find((event) => new Date(event.date).getTime() >= Date.now()) ?? null,
    fallbackEvent: DEMO_EVENTS.find((event) => new Date(event.date).getTime() < Date.now()) ?? null,
    recent,
    mix,
  };
}
