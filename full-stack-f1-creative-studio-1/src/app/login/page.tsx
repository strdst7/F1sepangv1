import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import AuthForm from "@/components/auth-form";

export const metadata = { title: "Crew login — Kracked Devs Studio" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/app");
  return (
    <AuthShell
      kicker="Crew access"
      title="Grab your badge."
      sub="The studio is open to everyone — sign in only if you want your crew badge and named sessions."
    >
      <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-carbon-800" />}>
        <AuthForm />
      </Suspense>
    </AuthShell>
  );
}
