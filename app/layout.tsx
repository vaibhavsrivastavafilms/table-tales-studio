import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HydrationDiagnostics from "@/components/HydrationDiagnostics";
import { getAppUrl } from "@/lib/env";
import {
  buildRootHtmlClass,
  logServerRootHtmlClasses,
} from "@/lib/hydrationDiagnostics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Font variables + layout on body — keeps `<html>` attribute-free so extension injections cannot clash with app classes. */
const ROOT_BODY_CLASS = buildRootHtmlClass(
  geistSans.variable,
  geistMono.variable,
  "flex min-h-full min-w-0 flex-col",
  "h-full antialiased"
);

logServerRootHtmlClasses(ROOT_BODY_CLASS);

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Table Tales Studio — AI Carousel Builder",
  description:
    "Upload food photos and art-direct a cinematic Pinterest-quality carousel — layouts, doodles, typography, export.",
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  openGraph: {
    title: "Table Tales Studio",
    description: "AI Food Storytelling Carousel Generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Table Tales Studio",
    description: "AI Food Storytelling Carousel Generator",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={ROOT_BODY_CLASS}
        data-root-body-class={ROOT_BODY_CLASS}
        suppressHydrationWarning
      >
        <HydrationDiagnostics serverRootClass={ROOT_BODY_CLASS} />
        {children}
      </body>
    </html>
  );
}
