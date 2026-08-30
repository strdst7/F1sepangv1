import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { videos } from "@/db/schema";

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
  if (data.kind !== undefined) patch.kind = String(data.kind);
  if (data.durationSec !== undefined) patch.durationSec = Math.max(1, Number(data.durationSec) || 30);
  if (data.url !== undefined) patch.url = String(data.url).trim();
  if (data.thumb !== undefined) patch.thumb = String(data.thumb).trim();
  if (data.views !== undefined) patch.views = Math.max(0, Number(data.views) || 0);
  if (data.eventId !== undefined) patch.eventId = data.eventId || null;

  const [row] = await db
    .update(videos)
    .set(patch)
    .where(eq(videos.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Video not found." }, { status: 404 });
  return NextResponse.json({ item: row });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(videos)
    .where(eq(videos.id, id))
    .returning({ id: videos.id });
  if (!row) return NextResponse.json({ error: "Video not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
