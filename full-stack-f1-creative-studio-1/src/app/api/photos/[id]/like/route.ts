import { NextResponse, type NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { photos } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const data = (await req.json().catch(() => ({}))) as { liked?: boolean };
  const delta = data.liked === false ? -1 : 1;

  const [row] = await db
    .update(photos)
    .set({
      likes: sql`greatest(0, ${photos.likes} + ${delta})`,
      updatedAt: new Date(),
    })
    .where(sql`${photos.id} = ${id}`)
    .returning();
  if (!row) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  return NextResponse.json({ item: row });
}
