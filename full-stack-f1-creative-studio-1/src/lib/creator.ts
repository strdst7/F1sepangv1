/* KD AI Creator — options, prompt builder, and the KD image pipeline.
   The tool renders the actual KD brand imagery (suit / car / grandstand)
   and stamps the creator's name, number and sponsor on top. */

export type ProductKey = "racing-suit" | "helmet" | "car" | "poster";

export const PRODUCTS: Array<{ key: ProductKey; label: string; icon: string; blurb: string }> = [
  { key: "racing-suit", label: "Racing Suit", icon: "layers", blurb: "The KD suit — your name, number and sponsor stamped on it." },
  { key: "helmet", label: "Helmet", icon: "shield", blurb: "A KD helmet livery with your number and visor-top name." },
  { key: "car", label: "Race Car", icon: "flag", blurb: "The KD #39 machine wearing your number and branding." },
  { key: "poster", label: "Event Poster", icon: "image", blurb: "The KD grandstand turned into a Sepang poster for you." },
];

export const COLORS: Array<{ key: string; label: string; hex: string; prompt: string }> = [
  { key: "carbon", label: "Carbon Black", hex: "#101410", prompt: "matte carbon black" },
  { key: "acid", label: "Acid Lime", hex: "#a3e635", prompt: "neon acid lime green" },
  { key: "violet", label: "Ultraviolet", hex: "#7c3aed", prompt: "deep ultraviolet purple" },
  { key: "racing-red", label: "Racing Red", hex: "#dc2626", prompt: "racing red" },
  { key: "royal", label: "Royal Blue", hex: "#2563eb", prompt: "royal blue" },
  { key: "gold", label: "Sepang Gold", hex: "#eab308", prompt: "sunset gold" },
  { key: "silver", label: "Silver", hex: "#cbd5e1", prompt: "race silver" },
  { key: "white", label: "Pearl White", hex: "#f5f5f0", prompt: "pearl white" },
];

export const SCENES: Array<{ key: string; label: string }> = [
  { key: "pit-lane", label: "Pit Lane" },
  { key: "trackside", label: "Trackside" },
  { key: "studio", label: "Studio" },
  { key: "neon", label: "Neon Night" },
];

export const STYLES: Array<{ key: string; label: string; prompt: string }> = [
  { key: "photoreal", label: "Photoreal", prompt: "photorealistic, 8k detail, sharp focus" },
  { key: "cinematic", label: "Cinematic", prompt: "cinematic, shallow depth of field, film grain, dramatic light" },
  { key: "render", label: "3D Render", prompt: "stylized 3D octane render, smooth lighting, clean surfaces" },
];

export const ASPECTS: Array<{ key: string; label: string; w: number; h: number }> = [
  { key: "1:1", label: "1:1 · Grid", w: 1024, h: 1024 },
  { key: "16:9", label: "16:9 · Wall", w: 1024, h: 576 },
  { key: "4:5", label: "4:5 · Post", w: 819, h: 1024 },
  { key: "9:16", label: "9:16 · Story", w: 576, h: 1024 },
];

export type CreatorOpts = {
  product: ProductKey;
  base: string;
  accent: string;
  name: string;
  number: string;
  sponsor: string;
  scene: string;
  style: string;
  aspect: string;
};

export const DEFAULT_OPTS: CreatorOpts = {
  product: "racing-suit",
  base: "carbon",
  accent: "acid",
  name: "AINA",
  number: "39",
  sponsor: "Kracked Devs",
  scene: "pit-lane",
  style: "photoreal",
  aspect: "4:5",
};

const colorOf = (key: string) => COLORS.find((c) => c.key === key) ?? COLORS[0];
const styleOf = (key: string) => STYLES.find((s) => s.key === key) ?? STYLES[0];

export function buildPrompt(o: CreatorOpts): string {
  const base = colorOf(o.base);
  const accent = colorOf(o.accent);
  const style = styleOf(o.style);
  const name = (o.name.trim() || "CREW").toUpperCase().slice(0, 14);
  const number = (o.number.trim() || "39").slice(0, 3);
  const sponsor = (o.sponsor.trim() || "Kracked Devs").slice(0, 22);

  switch (o.product) {
    case "racing-suit":
      return `KD creative material — the Kracked Devs racing suit in ${base.prompt} with ${accent.prompt} panels, "${sponsor}" across the chest, driver ${number}, name "${name}" on the waistband, Sepang pit lane, ${style.prompt}`;
    case "helmet":
      return `KD creative material — Kracked Devs helmet in ${base.prompt} with ${accent.prompt} stripes, "${sponsor}" decal, number ${number}, name "${name}" on the visor, ${style.prompt}`;
    case "car":
      return `KD creative material — the Kracked Devs #39 car in ${base.prompt} with ${accent.prompt} neon accents, number ${number}, "${sponsor}" on the sidepod, driver "${name}", ${style.prompt}`;
    case "poster":
      return `KD creative material — Sepang poster with "${sponsor.toUpperCase()}" headline, giant ${number} in ${accent.prompt}, driver "${name}", ${base.prompt} and ${accent.prompt} scheme, checkered details, ${style.prompt}`;
  }
}

/** The KD brand imagery used as the render source, matched to the product. */
export function kdImageFor(o: CreatorOpts): string {
  switch (o.product) {
    case "racing-suit":
    case "helmet":
      // Use the uploaded KD pit-wall portrait as a clean, real source image.
      // The old generated suit already contained brand copy, which caused the
      // canvas labels to appear duplicated in the final render.
      return "/images/pit-wall-briefing.jpeg";
    case "car":
      if (o.scene === "neon") return "/images/sepang-car-wet.webp";
      if (o.scene === "golden-hour" || o.scene === "trackside") return "/images/sepang-golden-car.jpeg";
      return "/images/sepang-grid-race.webp";
    case "poster":
      return "/images/sepang-aerial-circuit.webp";
  }
}

/* ---------------- canvas compositing ---------------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("KD asset failed to load"));
    img.src = src;
  });
}

type Spec = {
  text: string;
  x: number; // 0..1 of width
  y: number; // 0..1 of height
  size: number; // fraction of height
  color: string;
  glow?: boolean;
};

/**
 * Add one restrained creator plate instead of painting large duplicate brand
 * copy over an already-branded source photograph.
 */
function drawCreatorPlate(
  ctx: CanvasRenderingContext2D,
  tw: number,
  th: number,
  name: string,
  number: string,
  sponsor: string,
  accent: string,
  dark: string,
  white: string
) {
  const plateH = Math.max(76, Math.round(th * 0.105));
  const y = th - plateH;
  const padX = Math.round(tw * 0.05);
  const accentBar = Math.max(8, Math.round(tw * 0.012));

  const gradient = ctx.createLinearGradient(0, y, 0, th);
  gradient.addColorStop(0, "rgba(6,8,6,0.68)");
  gradient.addColorStop(1, "rgba(6,8,6,0.94)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, tw, plateH);
  ctx.fillStyle = accent;
  ctx.fillRect(0, y, accentBar, plateH);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 0;
  ctx.strokeStyle = dark;

  const nameSize = Math.max(20, Math.round(th * 0.045));
  ctx.font = `900 ${nameSize}px "Chakra Petch", "Arial Black", sans-serif`;
  ctx.lineWidth = Math.max(2, nameSize * 0.08);
  ctx.strokeText(name, padX, y + plateH * 0.39);
  ctx.fillStyle = accent;
  ctx.fillText(name, padX, y + plateH * 0.39);

  const sponsorSize = Math.max(12, Math.round(th * 0.022));
  ctx.font = `600 ${sponsorSize}px "IBM Plex Mono", monospace`;
  ctx.lineWidth = Math.max(1, sponsorSize * 0.05);
  ctx.strokeText(sponsor, padX, y + plateH * 0.76);
  ctx.fillStyle = white;
  ctx.fillText(sponsor, padX, y + plateH * 0.76);

  const numberSize = Math.max(28, Math.round(th * 0.075));
  ctx.textAlign = "right";
  ctx.font = `900 ${numberSize}px "Chakra Petch", "Arial Black", sans-serif`;
  ctx.lineWidth = Math.max(2, numberSize * 0.08);
  ctx.strokeText(`#${number}`, tw - padX, y + plateH * 0.53);
  ctx.fillStyle = accent;
  ctx.fillText(`#${number}`, tw - padX, y + plateH * 0.53);
}

/**
 * Render the KD image for the chosen product in the chosen aspect,
 * stamped with the creator's name / number / sponsor.
 * Returns a JPEG data URL.
 */
export async function composeKdImage(o: CreatorOpts, seed: number): Promise<string> {
  try {
    await document.fonts.ready;
  } catch {
    /* fonts may not be ready — fallbacks are fine */
  }
  const src = kdImageFor(o);
  const img = await loadImage(src);
  const aspect = ASPECTS.find((a) => a.key === o.aspect) ?? ASPECTS[2];
  const tw = aspect.w;
  const th = aspect.h;

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // cover-crop with a subtle per-seed pan so re-rolls shift the frame
  const pan = ((seed % 11) / 11 - 0.5) * 0.06;
  const scale = Math.max(tw / img.width, th / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (tw - dw) / 2 + pan * tw, (th - dh) / 2, dw, dh);

  // vignette for the poster feel
  const grd = ctx.createRadialGradient(
    tw / 2, th / 2, Math.min(tw, th) * 0.35,
    tw / 2, th / 2, Math.max(tw, th) * 0.78
  );
  grd.addColorStop(0, "rgba(6,8,6,0)");
  grd.addColorStop(1, "rgba(6,8,6,0.42)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, tw, th);

  const accent = colorOf(o.accent).hex;
  const white = "#f2f5ef";
  const dark = "#0a0d0a";
  const name = (o.name.trim() || "CREW").toUpperCase().slice(0, 14);
  const number = (o.number.trim() || "39").slice(0, 3);
  const sponsor = (o.sponsor.trim() || "Kracked Devs").toUpperCase().slice(0, 22);
  const jitter = (seed % 5) * 0.004 - 0.008;

  const specs: Spec[] = [];
  switch (o.product) {
    case "racing-suit":
    case "helmet":
      // The uploaded source already carries the KD brand marks. Keep the
      // creator-specific information in one clean lower-third plate.
      break;
    case "car":
      specs.push({ text: number, x: 0.28, y: 0.42 + jitter, size: 0.16, color: accent, glow: true });
      break;
    case "poster":
      specs.push({ text: sponsor, x: 0.5, y: 0.14, size: 0.075, color: white, glow: true });
      specs.push({ text: number, x: 0.5, y: 0.45 + jitter, size: 0.34, color: accent, glow: true });
      specs.push({ text: name, x: 0.5, y: 0.66, size: 0.07, color: white });
      specs.push({ text: "SEPANG · T103 · 5.643 KM", x: 0.5, y: 0.75, size: 0.032, color: accent });
      break;
  }

  for (const s of specs) {
    const size = Math.max(14, Math.round(s.size * th));
    ctx.font = `900 ${size}px "Chakra Petch", "Arial Black", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.strokeStyle = dark;
    ctx.strokeText(s.text, s.x * tw, s.y * th);
    if (s.glow) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = size * 0.28;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = s.color;
    ctx.fillText(s.text, s.x * tw, s.y * th);
    ctx.shadowBlur = 0;
  }

  if (o.product === "racing-suit" || o.product === "helmet" || o.product === "car") {
    drawCreatorPlate(ctx, tw, th, name, number, sponsor, accent, dark, white);
  }

  return canvas.toDataURL("image/jpeg", 0.88);
}

/* ---------------- offline vector fallback ---------------- */

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function fallbackMockup(opts: CreatorOpts): string {
  const base = colorOf(opts.base).hex;
  const accent = colorOf(opts.accent).hex;
  const name = esc((opts.name.trim() || "CREW").toUpperCase().slice(0, 14));
  const number = esc((opts.number.trim() || "39").slice(0, 3));
  const sponsor = esc((opts.sponsor.trim() || "Kracked Devs").slice(0, 22));
  const dark = "#0a0d0a";
  const panel = "#10150f";

  let body = "";
  if (opts.product === "racing-suit") {
    body = `
    <circle cx="200" cy="86" r="52" fill="${base}" stroke="${accent}" stroke-width="8"/>
    <path d="M152 62 q48 -34 96 0 l-10 34 q-38 -18 -76 0 z" fill="${dark}"/>
    <rect x="166" y="64" width="68" height="18" rx="9" fill="${accent}" opacity="0.85"/>
    <path d="M118 148 L282 148 L296 470 L256 560 L144 560 L104 470 Z" fill="${base}" stroke="${accent}" stroke-width="6"/>
    <path d="M118 148 L92 210 L108 330 L136 300 L128 200 Z" fill="${base}" stroke="${accent}" stroke-width="5"/>
    <path d="M282 148 L308 210 L292 330 L264 300 L272 200 Z" fill="${base}" stroke="${accent}" stroke-width="5"/>
    <rect x="120" y="164" width="160" height="30" fill="${accent}"/>
    <text x="200" y="185" font-family="Arial, sans-serif" font-weight="bold" font-size="19" fill="${dark}" text-anchor="middle" letter-spacing="1">${sponsor}</text>
    <circle cx="200" cy="270" r="40" fill="${accent}"/>
    <text x="200" y="286" font-family="Arial, sans-serif" font-weight="bold" font-size="44" fill="${dark}" text-anchor="middle">${number}</text>
    <rect x="124" y="420" width="152" height="16" fill="${accent}"/>
    <text x="200" y="436" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="${dark}" text-anchor="middle">${name}</text>
    <circle cx="200" cy="340" r="16" fill="${dark}" stroke="${accent}" stroke-width="4"/>`;
  } else if (opts.product === "helmet") {
    body = `
    <rect x="58" y="58" width="284" height="236" rx="118" fill="${base}" stroke="${accent}" stroke-width="10"/>
    <path d="M96 176 q104 -70 208 0 l-8 66 q-96 -52 -192 0 z" fill="${dark}"/>
    <rect x="104" y="150" width="192" height="66" rx="33" fill="${dark}" stroke="${accent}" stroke-width="5"/>
    <path d="M112 246 q88 -40 176 0 l0 20 q-88 -36 -176 0 z" fill="${accent}"/>
    <text x="200" y="106" font-family="Arial, sans-serif" font-weight="bold" font-size="17" fill="${accent}" text-anchor="middle" letter-spacing="2">${sponsor}</text>
    <text x="200" y="318" font-family="Arial, sans-serif" font-weight="bold" font-size="64" fill="${accent}" text-anchor="middle">${number}</text>
    <text x="200" y="354" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#c9d2c4" text-anchor="middle" letter-spacing="3">${name}</text>`;
  } else if (opts.product === "car") {
    body = `
    <path d="M28 158 L64 116 L132 100 L206 92 L286 98 L348 128 L372 158 Z" fill="${base}" stroke="${accent}" stroke-width="5"/>
    <path d="M64 116 L132 100 L206 92 L246 138 L96 146 Z" fill="${accent}" opacity="0.8"/>
    <rect x="196" y="86" width="26" height="30" rx="6" fill="${base}" stroke="${accent}" stroke-width="4"/>
    <circle cx="96" cy="168" r="34" fill="#0a0a0a" stroke="${accent}" stroke-width="5"/>
    <circle cx="96" cy="168" r="12" fill="#1c221c"/>
    <circle cx="330" cy="168" r="34" fill="#0a0a0a" stroke="${accent}" stroke-width="5"/>
    <circle cx="330" cy="168" r="12" fill="#1c221c"/>
    <circle cx="212" cy="132" r="26" fill="${accent}"/>
    <text x="212" y="142" font-family="Arial, sans-serif" font-weight="bold" font-size="30" fill="${dark}" text-anchor="middle">${number}</text>
    <text x="140" y="176" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="${accent}" text-anchor="middle">${sponsor}</text>
    <text x="212" y="212" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#c9d2c4" text-anchor="middle" letter-spacing="3">${name}</text>`;
  } else {
    const strip = (y: number) => {
      let s = "";
      for (let i = 0; i < 20; i++) {
        s += `<rect x="${i * 20}" y="${y}" width="20" height="18" fill="${i % 2 ? accent : dark}"/>`;
      }
      return s;
    };
    body = `
    ${strip(0)}
    <text x="200" y="118" font-family="Arial, sans-serif" font-weight="bold" font-size="34" fill="${accent}" text-anchor="middle" letter-spacing="4">KRACKED DEVS</text>
    <rect x="70" y="140" width="260" height="6" fill="${accent}"/>
    <text x="200" y="248" font-family="Arial, sans-serif" font-weight="bold" font-size="150" fill="${base}" stroke="${accent}" stroke-width="4" text-anchor="middle">${number}</text>
    <text x="200" y="316" font-family="Arial, sans-serif" font-weight="bold" font-size="26" fill="#f2f5ef" text-anchor="middle" letter-spacing="6">${name}</text>
    <text x="200" y="356" font-family="Arial, sans-serif" font-size="15" fill="${accent}" text-anchor="middle" letter-spacing="2">SEPANG · T103 · 5.643 KM</text>
    <rect x="70" y="384" width="260" height="6" fill="${accent}"/>
    <text x="200" y="428" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#f2f5ef" text-anchor="middle">${sponsor}</text>
    ${strip(482)}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="800" height="1000">
  <rect width="400" height="500" fill="${panel}"/>
  <text x="24" y="34" font-family="Arial, sans-serif" font-size="10" fill="#5c6b58" letter-spacing="3">KD VECTOR MOCKUP</text>
  <circle cx="376" cy="28" r="10" fill="${accent}"/>
  ${body}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function randomSeed() {
  return Math.floor(Math.random() * 899999) + 100000;
}
