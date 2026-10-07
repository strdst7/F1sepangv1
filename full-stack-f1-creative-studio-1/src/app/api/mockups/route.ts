import { NextResponse, type NextRequest } from "next/server";
import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, mockups } from "@/db/schema";
import { DEMO_MOCKUPS } from "@/lib/demo-data";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.toLowerCase().trim();

  const conditions = [];
  if (status && status !== "all") conditions.push(eq(mockups.status, status));
  if (q)
    conditions.push(
      sql`lower(${mockups.title}) like ${`%${q}%`} or lower(${mockups.prompt}) like ${`%${q}%`}`
    );

  try {
    const rows = await db
      .select({ mockup: mockups, eventLabel: events.name })
      .from(mockups)
      .leftJoin(events, eq(mockups.eventId, events.id))
      .where(conditions.length ? (conditions.length === 1 ? conditions[0] : or(...conditions)) : undefined)
      .orderBy(desc(mockups.createdAt));

    return NextResponse.json({
      items: rows.map((r) => ({
        ...r.mockup,
        eventLabel: r.eventLabel,
        createdAt: r.mockup.createdAt,
      })),
    });
  } catch {
    // The creator and library remain usable in demo mode without Postgres.
    return NextResponse.json({ items: DEMO_MOCKUPS });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  const data = await req.json().catch(() => ({}));
  const title = String(data.title ?? "").trim();
  const prompt = String(data.prompt ?? "").trim();
  if (!title || !prompt)
    return NextResponse.json(
      { error: "A title and a scene prompt are required." },
      { status: 400 }
    );

  const [created] = await db
    .insert(mockups)
    .values({
      title,
      prompt,
      style: String(data.style ?? "neon-night"),
      aspect: String(data.aspect ?? "16:9"),
      // The KD Creator saves finished renders directly; the AI renderer queues
      // new scenes as "rendering" and patches them to ready later.
      status: data.status === "ready" ? "ready" : "rendering",
      url: data.url ? String(data.url) : null,
      eventId: data.eventId || null,
      createdBy: user?.id ?? null,
    })
    .returning();
  return NextResponse.json({ item: created }, { status: 201 });
}
