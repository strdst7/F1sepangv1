import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { photos } from "@/db/schema";

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
  if (data.caption !== undefined) patch.caption = data.caption ? String(data.caption) : null;
  if (data.category !== undefined) patch.category = String(data.category);
  if (data.url !== undefined) {
    const u = String(data.url).trim();
    if (!u) return NextResponse.json({ error: "URL is required." }, { status: 400 });
    patch.url = u;
  }
  if (data.eventId !== undefined) patch.eventId = data.eventId || null;
  if (data.likes !== undefined) patch.likes = Math.max(0, Number(data.likes) || 0);

  const [row] = await db
    .update(photos)
    .set(patch)
    .where(eq(photos.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  return NextResponse.json({ item: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(photos)
    .where(eq(photos.id, id))
    .returning({ id: photos.id });
  if (!row) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
