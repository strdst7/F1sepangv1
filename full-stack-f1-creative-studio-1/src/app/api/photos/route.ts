import { NextResponse, type NextRequest } from "next/server";
import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, photos } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q")?.toLowerCase().trim();

  const conditions = [];
  if (category && category !== "all") conditions.push(eq(photos.category, category));
  if (q)
    conditions.push(
      sql`lower(${photos.title}) like ${`%${q}%`} or lower(coalesce(${photos.caption}, '')) like ${`%${q}%`}`
    );

  const rows = await db
    .select({ photo: photos, eventLabel: events.name })
    .from(photos)
    .leftJoin(events, eq(photos.eventId, events.id))
    .where(conditions.length ? (conditions.length === 1 ? conditions[0] : or(...conditions)) : undefined)
    .orderBy(desc(photos.createdAt));

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r.photo,
      eventLabel: r.eventLabel,
      createdAt: r.photo.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  const data = await req.json().catch(() => ({}));
  const title = String(data.title ?? "").trim();
  const url = String(data.url ?? "").trim();
  if (!title || !url)
    return NextResponse.json(
      { error: "A title and an image URL are required." },
      { status: 400 }
    );

  const [created] = await db
    .insert(photos)
    .values({
      title,
      caption: data.caption ? String(data.caption) : null,
      category: String(data.category ?? "trackside"),
      url,
      eventId: data.eventId || null,
      likes: Number(data.likes ?? 0),
      createdBy: user?.id ?? null,
    })
    .returning();
  return NextResponse.json({ item: created }, { status: 201 });
}
