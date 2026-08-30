import { NextResponse, type NextRequest } from "next/server";
import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, videos } from "@/db/schema";
import { DEMO_VIDEOS } from "@/lib/demo-data";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const q = url.searchParams.get("q")?.toLowerCase().trim();

  const conditions = [];
  if (kind && kind !== "all") conditions.push(eq(videos.kind, kind));
  if (q) conditions.push(sql`lower(${videos.title}) like ${`%${q}%`}`);

  try {
    const rows = await db
      .select({ video: videos, eventLabel: events.name })
      .from(videos)
      .leftJoin(events, eq(videos.eventId, events.id))
      .where(conditions.length ? (conditions.length === 1 ? conditions[0] : or(...conditions)) : undefined)
      .orderBy(desc(videos.createdAt));

    return NextResponse.json({
      items: rows.map((r) => ({
        ...r.video,
        eventLabel: r.eventLabel,
        createdAt: r.video.createdAt,
      })),
    });
  } catch {
    // Read-only demo fallback keeps thumbnails and sample clips visible.
    return NextResponse.json({ items: DEMO_VIDEOS });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  const data = await req.json().catch(() => ({}));
  const title = String(data.title ?? "").trim();
  const url = String(data.url ?? "").trim();
  const thumb = String(data.thumb ?? "").trim();
  if (!title || !url || !thumb)
    return NextResponse.json(
      { error: "Title, video URL and thumbnail are required." },
      { status: 400 }
    );

  const [created] = await db
    .insert(videos)
    .values({
      title,
      kind: String(data.kind ?? "highlight"),
      durationSec: Number(data.durationSec ?? 30),
      url,
      thumb,
      views: Number(data.views ?? 0),
      eventId: data.eventId || null,
      createdBy: user?.id ?? null,
    })
    .returning();
  return NextResponse.json({ item: created }, { status: 201 });
}
