import type { Metadata } from "next";
import { Oswald, Space_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AccessGate } from "@/components/layout/AccessGate";
import { WeightsHydrator } from "@/components/settings/WeightsHydrator";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "CourtIQ — Moneyball Analytics",
  description:
    "Análisis Moneyball para el básquet argentino e internacional. Encontrá al próximo jugador subvalorado antes que nadie.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${oswald.variable} ${spaceMono.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Anti-FOUC: fija el tema antes del primer paint según localStorage / prefers-color-scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('courtiq.theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <AccessGate>
          <WeightsHydrator />
          <Navbar />
          {children}
        </AccessGate>
      </body>
    </html>
  );
}
