import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, users } from "@/db/schema";

const COOKIE = "kd_session";
const DEMO_COOKIE = "kd_demo_session";
const DEMO_COOKIE_VALUE = "demo-crew";
const SEVEN_DAYS = 7 * 24 * 60 * 60;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/** Public demo credentials shown on the sign-in screen. */
export const DEMO_USER: SessionUser = {
  id: "demo-user",
  name: "Aina Rahman",
  email: "crew@krackeddevs.com",
  role: "lead",
};

export function isDemoCredentials(email: string, password: string): boolean {
  return email === DEMO_USER.email && password === "kracked2026";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s2:${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  stored: string
): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "s2" || !salt || !hash) return false;
  const check = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    check.length === expected.length && timingSafeEqual(check, expected)
  );
}

export async function createDemoSession(): Promise<void> {
  const jar = await cookies();
  jar.set(DEMO_COOKIE, DEMO_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SEVEN_DAYS * 1000);
  await db.insert(authSessions).values({ userId, token, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  if (jar.get(DEMO_COOKIE)?.value === DEMO_COOKIE_VALUE) return DEMO_USER;

  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  let rows: Array<{
    user: (typeof users.$inferSelect) & { createdAt: Date };
    expiresAt: Date;
  }>;
  try {
    rows = await db
      .select({ user: users, expiresAt: authSessions.expiresAt })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(eq(authSessions.token, token));
  } catch {
    return null;
  }

  if (!rows.length) return null;
  const { user, expiresAt } = rows[0];
  if (expiresAt.getTime() < Date.now()) {
    await destroySession();
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      await db.delete(authSessions).where(eq(authSessions.token, token));
    } catch {
      /* ignore */
    }
  }
  jar.delete(COOKIE);
  jar.delete(DEMO_COOKIE);
}
