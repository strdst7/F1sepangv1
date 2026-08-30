import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mockups } from "@/db/schema";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const data = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) {
    const t = String(data.title).trim();
    if (!t) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    patch.title = t;
  }
  if (data.prompt !== undefined) patch.prompt = String(data.prompt).trim();
  if (data.style !== undefined) patch.style = String(data.style);
  if (data.aspect !== undefined) patch.aspect = String(data.aspect);
  if (data.status !== undefined) patch.status = String(data.status);
  if (data.url !== undefined) patch.url = data.url ? String(data.url) : null;
  if (data.eventId !== undefined) patch.eventId = data.eventId || null;

  const [row] = await db
    .update(mockups)
    .set(patch)
    .where(eq(mockups.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Mockup not found." }, { status: 404 });
  return NextResponse.json({ item: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(mockups)
    .where(eq(mockups.id, id))
    .returning({ id: mockups.id });
  if (!row) return NextResponse.json({ error: "Mockup not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
