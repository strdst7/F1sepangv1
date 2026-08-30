import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth";
import { DashShell } from "@/components/dash-shell";

export const metadata = { title: "Studio — Kracked Devs" };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  return <DashShell user={user}>{children}</DashShell>;
}
