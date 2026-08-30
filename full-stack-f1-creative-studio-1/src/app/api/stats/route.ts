import { NextResponse, type NextRequest } from "next/server";
import { and, desc, gte, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, mockups, photos, videos } from "@/db/schema";
import { PHOTO_CATS } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [photoCount, videoCount, mockCount, eventCount] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(photos),
    db.select({ n: sql<number>`count(*)` }).from(videos),
    db.select({ n: sql<number>`count(*)` }).from(mockups),
    db.select({ n: sql<number>`count(*)` }).from(events),
  ]);

  const [pWeek, vWeek, mWeek, eWeek] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(photos)
      .where(gte(photos.createdAt, weekAgo)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(videos)
      .where(gte(videos.createdAt, weekAgo)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(mockups)
      .where(gte(mockups.createdAt, weekAgo)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(events)
      .where(gte(events.createdAt, weekAgo)),
  ]);

  const nextRows = await db
    .select()
    .from(events)
    .where(gte(events.date, now))
    .orderBy(events.date)
    .limit(1);
  const nextEvent = nextRows[0] ?? null;

  const pastEventRows = await db
    .select()
    .from(events)
    .where(gt(events.date, new Date(0)))
    .orderBy(desc(events.date))
    .limit(1);
  const fallbackEvent = nextEvent ? null : pastEventRows[0] ?? null;

  const [recentPhotos, recentVideos, recentMockups] = await Promise.all([
    db.select().from(photos).orderBy(desc(photos.createdAt)).limit(6),
    db.select().from(videos).orderBy(desc(videos.createdAt)).limit(6),
    db.select().from(mockups).orderBy(desc(mockups.createdAt)).limit(6),
  ]);

  const recent = [
    ...recentPhotos.map((p) => ({
      type: "photo",
      id: p.id,
      title: p.title,
      url: p.url,
      meta: p.category,
      date: p.createdAt,
    })),
    ...recentVideos.map((v) => ({
      type: "video",
      id: v.id,
      title: v.title,
      url: v.thumb,
      meta: v.kind,
      date: v.createdAt,
    })),
    ...recentMockups
      .filter((m) => m.status === "ready")
      .map((m) => ({
        type: "mockup",
        id: m.id,
        title: m.title,
        url: m.url ?? "",
        meta: m.style,
        date: m.createdAt,
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const catRows = await db
    .select({ category: photos.category, n: sql<number>`count(*)` })
    .from(photos)
    .groupBy(photos.category);
  const mix = Object.entries(PHOTO_CATS).map(([key]) => ({
    key,
    label: PHOTO_CATS[key],
    n: catRows.find((r) => r.category === key)?.n ?? 0,
  }));

  return NextResponse.json({
    counts: {
      photos: photoCount[0].n,
      videos: videoCount[0].n,
      mockups: mockCount[0].n,
      events: eventCount[0].n,
    },
    week: {
      photos: pWeek[0].n,
      videos: vWeek[0].n,
      mockups: mWeek[0].n,
      events: eWeek[0].n,
    },
    nextEvent,
    fallbackEvent,
    recent,
    mix,
  });
}
