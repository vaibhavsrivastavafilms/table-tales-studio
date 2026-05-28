import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAppUrl } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Table Tales Studio — AI Food Carousel Creator",
  description:
    "Create cinematic Instagram food storytelling carousels with AI captions and production-ready export.",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-w-0 flex-col">{children}</body>
    </html>
  );
}
