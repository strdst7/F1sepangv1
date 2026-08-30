import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import CreatorTool from "@/components/creator-tool";
import { Icon, Logo, ToastProvider } from "@/components/ui";

export const metadata = {
  title: "KD AI Creator — free custom racing suit, helmet & livery generator",
  description:
    "The free Kracked Devs image tool: put your name, number and sponsor on the KD racing suit, helmet, #39 car or Sepang grandstand poster.",
};

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const user = await getSessionUser();
  return (
    <ToastProvider>
      <div className="min-h-screen bg-carbon-950">
        {/* header */}
        <header className="border-b border-carbon-700 bg-carbon-900/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden items-center gap-1.5 rounded-lg border border-carbon-600 px-3.5 py-2 text-sm text-ink-400 transition hover:text-acid-400 sm:inline-flex"
              >
                <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" strokeWidth={2.4} />
                Back to site
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-lg border border-acid-400/50 bg-acid-400/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-acid-300 transition hover:bg-acid-400/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-acid-400 pulse-dot" />
                {user ? `${user.name} · open the studio` : "Open the studio"}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-acid-400">
                <Icon name="sparkles" className="h-4 w-4" />
                Free tool · open web — no signup
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                KD AI <span className="text-acid-400">Creator</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-400">
                The KD look, stamped with your name. Render the Kracked Devs
                racing suit, helmet, #39 car or Sepang grandstand poster with
                your number and sponsor — free, right here.
              </p>
            </div>
            <Link
              href="/app/mockups"
              className="inline-flex items-center gap-2 rounded-lg border border-carbon-600 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-400 transition hover:border-acid-400/50 hover:text-acid-400"
            >
              <Icon name="layers" className="h-4 w-4" />
              See the mockup wall
            </Link>
          </div>
          <CreatorTool />
        </main>

        <footer className="border-t border-carbon-700 bg-carbon-900">
          <div className="mx-auto max-w-7xl px-5 py-6">
            <div className="flex flex-col items-center gap-1.5 pb-5 text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-ink-100">
                NUR AMIRAH MOHD KAMIL
              </p>
              <p className="flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-acid-400">
                <span>KD Ambassadors</span>
                <span className="h-1 w-1 rounded-full bg-carbon-600" />
                <span>MI4INC</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-carbon-700 pt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
              <span>© {new Date().getFullYear()} Kracked Devs Creative</span>
              <span>KD render engine · open web · 2.95° N 101.70° E</span>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
