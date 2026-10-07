import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mockups, photos, videos } from "@/db/schema";
import { DEMO_MOCKUPS, DEMO_PHOTOS, DEMO_VIDEOS } from "@/lib/demo-data";

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
    return NextResponse.json({
      photos: DEMO_PHOTOS.slice(0, 10),
      videos: DEMO_VIDEOS.slice(0, 3),
      mockups: DEMO_MOCKUPS.filter((item) => item.status === "ready").slice(0, 4),
    });
  }
}
