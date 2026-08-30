import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mockups, photos, videos } from "@/db/schema";

export const runtime = "nodejs";

/** Public feed used by the landing page wall. */
export async function GET() {
  try {
    const [photosRows, videosRows, mockRows] = await Promise.all([
      db.select().from(photos).orderBy(desc(photos.createdAt)).limit(10),
      db.select().from(videos).orderBy(desc(videos.createdAt)).limit(3),
      db
        .select()
        .from(mockups)
        .where(eq(mockups.status, "ready"))
        .orderBy(desc(mockups.createdAt))
        .limit(4),
    ]);
    return NextResponse.json({
      photos: photosRows,
      videos: videosRows,
      mockups: mockRows,
    });
  } catch {
    return NextResponse.json({ photos: [], videos: [], mockups: [] });
  }
}
