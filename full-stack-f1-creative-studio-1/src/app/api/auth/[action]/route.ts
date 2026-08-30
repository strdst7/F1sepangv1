import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createDemoSession,
  createSession,
  DEMO_USER,
  destroySession,
  getSessionUser,
  isDemoCredentials,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

async function body(req: NextRequest) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function demoLoginResponse() {
  return NextResponse.json({
    ok: true,
    user: DEMO_USER,
    demo: true,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const data = await body(req);

  if (action === "login") {
    const email = String(data.email ?? "").trim().toLowerCase();
    const password = String(data.password ?? "");
    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );

    try {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const user = rows[0];

      // A fresh database may not have been seeded yet. The public demo pass
      // should still let visitors into the read-only studio.
      if (!user && isDemoCredentials(email, password)) {
        await createDemoSession();
        return demoLoginResponse();
      }

      if (!user || !verifyPassword(password, user.passwordHash))
        return NextResponse.json(
          { error: "Wrong email or password. Check the pit board and try again." },
          { status: 401 }
        );
      await createSession(user.id);
      return NextResponse.json({
        ok: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch {
      // Keep the documented demo credentials usable while Postgres is down.
      if (isDemoCredentials(email, password)) {
        await createDemoSession();
        return demoLoginResponse();
      }
      return NextResponse.json(
        { error: "The studio database is offline. Use the demo crew pass or try again later." },
        { status: 503 }
      );
    }
  }

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 404 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  if (action !== "me")
    return NextResponse.json({ error: "Unknown action." }, { status: 404 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ user });
}
