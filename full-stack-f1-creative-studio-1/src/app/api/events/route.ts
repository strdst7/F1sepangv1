import { NextResponse, type NextRequest } from "next/server";
import { asc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const q = url.searchParams.get("q")?.toLowerCase().trim();

  const conditions = [];
  if (kind && kind !== "all") conditions.push(eq(events.kind, kind));
  if (q) conditions.push(sql`lower(${events.name}) like ${`%${q}%`}`);

  const rows = await db
    .select()
    .from(events)
    .where(conditions.length ? (conditions.length === 1 ? conditions[0] : or(...conditions)) : undefined)
    .orderBy(asc(events.date));
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  const data = await req.json().catch(() => ({}));
  const name = String(data.name ?? "").trim();
  const date = data.date ? new Date(data.date) : null;
  if (!name || !date || isNaN(date.getTime()))
    return NextResponse.json(
      { error: "A name and a valid date are required." },
      { status: 400 }
    );

  const [created] = await db
    .insert(events)
    .values({
      name,
      date,
      kind: String(data.kind ?? "photo-shoot"),
      status: String(data.status ?? "planned"),
      track: String(data.track ?? "Sepang International Circuit"),
      capacity: Number(data.capacity ?? 40),
      reserved: Number(data.reserved ?? 0),
      notes: data.notes ? String(data.notes) : null,
      createdBy: user?.id ?? null,
    })
    .returning();
  return NextResponse.json({ item: created }, { status: 201 });
}
