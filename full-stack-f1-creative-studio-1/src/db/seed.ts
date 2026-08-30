/* Seed script — run with: npx tsx src/db/seed.ts */
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";

// Load .env manually (tsx doesn't auto-load it)
try {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* rely on environment */
}

async function main() {
  const { db } = await import("./index");
  const { users, authSessions, events, photos, videos, mockups } = await import("./schema");

const hash = (pw: string) => {
  const salt = randomBytes(16).toString("hex");
  return `s2:${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
};

const at = (dayOffset: number, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

console.log("› Wiping existing data…");
await db.delete(photos);
await db.delete(videos);
await db.delete(mockups);
await db.delete(events);
await db.delete(authSessions);
await db.delete(users);

console.log("› Seeding crew…");
const [lead, crew] = await db
  .insert(users)
  .values([
    {
      email: "crew@krackeddevs.com",
      name: "Aina Rahman",
      passwordHash: hash("kracked2026"),
      role: "lead",
      createdAt: at(-400),
    },
    {
      email: "farid@krackeddevs.com",
      name: "Farid Zulkifli",
      passwordHash: hash("kracked2026"),
      role: "crew",
      createdAt: at(-300),
    },
  ])
  .returning();

console.log("› Seeding race events…");
const ev = (
  name: string,
  dayOffset: number,
  hour: number,
  kind: string,
  status: string,
  capacity: number,
  reserved: number,
  notes: string | null
) => ({ name, date: at(dayOffset, hour), kind, status, capacity, reserved, notes, createdBy: lead.id });

const [e1, e2, e3, e4, e5, e6, e7] = await db
  .insert(events)
  .values([
    ev("Malaysian GP — Race Day", 6, 9, "gp-weekend", "planned", 400, 268,
      "Full crew: 6 trackside pods, drone + host desk live from the P1 grandstand. Rain plan: cover all long-lens rigs by 14:00."),
    ev("Fan Pit Walk & Autograph Session", 5, 15, "fan-day", "planned", 120, 94,
      "Signed helmets ×40, pit-wall photo ops at Turn 14. Kids line-up priority 13:30."),
    ev("Night Neon Launch — AI Wall Install", 2, 20, "content-day", "shooting", 150, 77,
      "Neon wall reveal + live AI render demo at the Turn 14 viewing deck. 32px floodlights, fog low."),
    ev("Drone Recon — 90° & S2-S3", -3, 7, "content-day", "wrapped", 12, 12,
      "Morning light pass for the launch film. 4K ProRes, 60fps. Wind hold under 12 kt."),
    ev("Paddock Access — Team Hospitality", -10, 18, "paddock", "delivered", 60, 48,
      "Cockpit shots, crew portraits and hospitality walk-and-talk. Delivered 48h, client signed off."),
    ev("Golden Hour Shoot — Main Straight", -21, 17, "photo-shoot", "delivered", 30, 30,
      "Golden window 17:30–18:20. Long exposure tails + flare through the palms. All 30 delivered."),
    ev("Kids Race Day — Kart Circuit", -40, 9, "fan-day", "delivered", 80, 80,
      "Full house. Helmet-paint corner, photo booth, drone circle at 12:00. Album shipped."),
  ])
  .returning();

console.log("› Seeding photos…");
const px = (
  title: string,
  url: string,
  category: string,
  eventId: string | null,
  likes: number,
  dayOffset: number,
  caption: string
) => ({ title, url, category, eventId, likes, caption, createdBy: lead.id, createdAt: at(dayOffset, 16) });

const PHOTOS = [
  px("Pit wall briefing", "/images/pit-wall-briefing.jpeg", "pit-lane", e3.id, 176, 0, "The KD crew resets between runs in the Sepang pit lane."),
  px("Crew conversation, garage 7", "/images/pit-lane-crew.jpeg", "pit-lane", e1.id, 121, 0, "A quiet moment before the next pit-lane push."),
  px("Pit radio interview", "/images/pit-radio-interview.jpeg", "fan-moment", e3.id, 148, 0, "Live from the garage lane with the KD crew."),
  px("Golden car, Sepang straight", "/images/sepang-golden-car.jpeg", "trackside", e6.id, 204, 0, "Neon lime through the palms at golden hour."),
  px("Chequered moment, T103", "https://images.pexels.com/photos/29252117/pexels-photo-29252117.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "trackside", e1.id, 128, -1, "1/4000 · f/2.8 · ISO 200 — sparks at the line"),
  px("Turn 4 dive — brake lights", "https://images.pexels.com/photos/28680795/pexels-photo-28680795.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "trackside", e1.id, 96, -2, "Heavy into the 4th, 312 km/h out"),
  px("Chicane exit, 312 km/h", "https://images.pexels.com/photos/28832062/pexels-photo-28832062.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "trackside", e1.id, 74, -2, "Pan shot, 1/2000 at full throttle"),
  px("Strobe streak, S2", "https://images.pexels.com/photos/29309759/pexels-photo-29309759.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "trackside", e1.id, 51, -4, "Light-paint experiment, 2s exposure"),
  px("Night run, floodlights", "https://images.pexels.com/photos/29309753/pexels-photo-29309753.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "trackside", e3.id, 89, -5, "Neon launch pre-run, 22:40 local"),
  px("Monsoon session, full wets", "https://images.pexels.com/photos/31331382/pexels-photo-31331382.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "trackside", e6.id, 143, -6, "Sepang rain does what it wants"),
  px("Crew set, pre-run", "https://images.pexels.com/photos/13857975/pexels-photo-13857975.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "pit-lane", e1.id, 112, -1, "Garage 7, five minutes to lights out"),
  px("Rain covers on, garage 7", "https://images.pexels.com/photos/29320671/pexels-photo-29320671.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "pit-lane", e1.id, 67, -3, "The sound of a thousand hoods going up"),
  px("Friday garage, toolbox ballet", "https://images.pexels.com/photos/29255757/pexels-photo-29255757.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "pit-lane", e1.id, 83, -4, "Hands you memorise before you know their names"),
  px("Pit lane, calm before", "https://images.pexels.com/photos/29255759/pexels-photo-29255759.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "pit-lane", e1.id, 45, -7, "14:52 — the quietest loudest minute of the day"),
  px("Pit walk, row 3 chaos", "https://images.pexels.com/photos/29327965/pexels-photo-29327965.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "fan-moment", e2.id, 201, -1, "Overhead of the pit wall crowd, golden"),
  px("P1 grandstand full house", "https://images.pexels.com/photos/36920241/pexels-photo-36920241.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "fan-moment", e1.id, 154, -2, "40,000 people, one breath"),
  px("Family zone, pit exit", "https://images.pexels.com/photos/32545432/pexels-photo-32545432.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "fan-moment", e7.id, 77, -40, "Kids Race Day, first lap of the kart circuit"),
  px("Helmet check, cockpit", "https://images.pexels.com/photos/11848352/pexels-photo-11848352.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "detail", e5.id, 92, -10, "Halo check before paddock entry"),
  px("Podium crew, post-race", "https://images.pexels.com/photos/29321013/pexels-photo-29321013.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "paddock", e5.id, 133, -10, "When the work is done and the spray is out"),
  px("Monochrome row Z", "https://images.pexels.com/photos/29378936/pexels-photo-29378936.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", "fan-moment", e6.id, 58, -21, "B&W test frame from the golden shoot"),
];
await db.insert(photos).values(PHOTOS);

console.log("› Seeding videos…");
const vx = (
  title: string,
  kind: string,
  durationSec: number,
  url: string,
  thumb: string,
  views: number,
  eventId: string | null,
  dayOffset: number
) => ({ title, kind, durationSec, url, thumb, views, eventId, createdBy: crew.id, createdAt: at(dayOffset, 18) });

await db.insert(videos).values([
  vx("Race Day — Full Throttle Edit", "highlight", 24,
    "https://videos.pexels.com/video-files/36062880/15293984_1920_1080_30fps.mp4",
    "https://images.pexels.com/videos/36062880/pexels-photo-36062880.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    2431, e1.id, -1),
  vx("Apex, 4000 fps", "slow-mo", 6,
    "https://videos.pexels.com/video-files/36062879/15293954_1920_1080_30fps.mp4",
    "https://images.pexels.com/videos/36062879/pexels-photo-36062879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    1876, e1.id, -2),
  vx("Crew push, garage 7", "pit-stop", 8,
    "https://videos.pexels.com/video-files/16605635/16605635-uhd_3840_2160_60fps.mp4",
    "https://images.pexels.com/videos/16605635/pexels-photo-16605635.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    954, e1.id, -3),
  vx("Pit stop choreo, 2.1s", "pit-stop", 10,
    "https://videos.pexels.com/video-files/16605636/16605636-uhd_3840_2160_60fps.mp4",
    "https://images.pexels.com/videos/16605636/f1-formula-1-pit-stop-16605636.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    1207, e1.id, -4),
  vx("Aerial: pit lane ballet", "drone", 36,
    "https://videos.pexels.com/video-files/35818310/15187054_3840_2160_30fps.mp4",
    "https://images.pexels.com/videos/35818310/pexels-photo-35818310.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    3012, e4.id, -3),
  vx("Tyre change, macro", "pit-stop", 5,
    "https://videos.pexels.com/video-files/9823146/9823146-hd_1920_1080_25fps.mp4",
    "https://images.pexels.com/videos/9823146/pexels-photo-9823146.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    733, e5.id, -10),
  vx("Wheel gun ballet", "pit-stop", 15,
    "https://videos.pexels.com/video-files/9737948/9737948-uhd_3840_2160_24fps.mp4",
    "https://images.pexels.com/videos/9737948/pexels-photo-9737948.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    1101, e1.id, -5),
  vx("Main straight streak", "slow-mo", 6,
    "https://videos.pexels.com/video-files/18447536/18447536-hd_1920_1080_60fps.mp4",
    "https://images.pexels.com/videos/18447536/car-cars-cinema-cordele-18447536.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    1588, e6.id, -21),
]);

console.log("› Seeding AI mockups…");
const mx = (
  title: string,
  prompt: string,
  style: string,
  aspect: string,
  status: string,
  url: string | null,
  eventId: string | null,
  dayOffset: number
) => ({ title, prompt, style, aspect, status, url, eventId, createdBy: crew.id, createdAt: at(dayOffset, 21) });

await db.insert(mockups).values([
  mx("Livery test — dusk pit",
    "New livery test mule in the pit lane at dusk, crew in black and acid suits, low hero angle, floodlights just coming up.",
    "pit-lane", "16:9", "ready", "/images/hero.jpg", e5.id, -1),
  mx("Monsoon push — wet grid",
    "Matte black #39 with neon lime livery drifting through a rain-soaked Sepang corner at night, spray catching the floodlights, cinematic 16:9.",
    "storm-rain", "16:9", "ready", "/images/mockup-rain.jpg", e1.id, -2),
  mx("Night launch — neon wall",
    "Vertical shot of the neon install at the Turn 14 viewing deck, car #39 passing under the wall, crowd silhouettes, acid green glow.",
    "neon-night", "9:16", "rendering", null, e3.id, -2),
  mx("Neon pit, 2 AM",
    "Pit lane at 2 AM wrapped in acid-green and violet neon, mist on the asphalt, crew silhouettes prepping the #39 for the night launch.",
    "neon-night", "16:9", "ready", "/images/mockup-pit.jpg", e3.id, -3),
  mx("Launch week hero — wet grid",
    "Hero frame for launch week: wet grid at dawn, #39 on pole, rain mist, acid-green livery popping against the grey.",
    "storm-rain", "16:9", "rendering", null, e3.id, -1),
  mx("Golden straight",
    "Car #39 on the main straight at golden hour, jungle blur, long-exposure tail, warm flare through the palms.",
    "golden-hour", "16:9", "ready", "/images/mockup-sunset.jpg", e6.id, -6),
]);

console.log("");
console.log("✔ Seed complete.");
console.log(`  crew      : 2  (crew@krackeddevs.com / kracked2026)`);
console.log(`  events    : 7`);
console.log(`  photos    : ${PHOTOS.length}`);
console.log(`  videos    : 8`);
console.log(`  mockups   : 6  (2 rendering, 4 ready)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
