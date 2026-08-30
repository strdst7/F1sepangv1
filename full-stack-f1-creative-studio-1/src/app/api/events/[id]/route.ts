import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const data = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (!name)
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    patch.name = name;
  }
  if (data.date !== undefined) {
    const d = new Date(data.date);
    if (isNaN(d.getTime()))
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    patch.date = d;
  }
  for (const k of ["kind", "status", "track", "notes"] as const) {
    if (data[k] !== undefined) patch[k] = String(data[k] ?? "") || null;
  }
  for (const k of ["capacity", "reserved"] as const) {
    if (data[k] !== undefined) patch[k] = Number(data[k] ?? 0);
  }

  const [row] = await db
    .update(events)
    .set(patch)
    .where(eq(events.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ item: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning({ id: events.id });
  if (!row) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
