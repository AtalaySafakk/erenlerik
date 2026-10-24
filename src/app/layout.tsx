import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { oturumGetir } from "@/lib/auth";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "İK Program",
  description: "Görev yeri esaslı puantaj, izin, icra ve bordro",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const oturum = await oturumGetir();
  return (
    <html lang="tr" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {oturum ? <AppShell oturum={oturum}>{children}</AppShell> : children}
      </body>
    </html>
  );
}
