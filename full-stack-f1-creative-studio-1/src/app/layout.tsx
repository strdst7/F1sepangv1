import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#060806'/><rect x='3' y='3' width='58' height='58' rx='11' fill='none' stroke='#a3e635' stroke-width='4'/><text x='32' y='43' font-family='Arial, sans-serif' font-size='26' font-weight='bold' fill='#a3e635' text-anchor='middle'>KD</text></svg>"
  );

export const metadata: Metadata = {
  title: "Kracked Devs — Sepang F1 Creative Studio",
  description:
    "A creative studio for F1 Sepang fans and visitors. We produce the moments of race events — photography, videography and AI mockup scenes from the circuit at Sepang, Malaysia.",
  icons: { icon: favicon },
};

export const viewport: Viewport = {
  themeColor: "#060806",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-carbon-950 font-sans text-ink-100 antialiased">
        <div className="noise-layer" aria-hidden />
        {children}
      </body>
    </html>
  );
}
