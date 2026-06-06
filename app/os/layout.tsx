import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { OsThemeProvider } from "@/components/os/OsThemeProvider";
import "./os.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-os-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Table Tales OS",
    template: "%s · Table Tales OS",
  },
  description: "Hospitality operations platform for restaurants and food brands.",
};

export default function OsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cormorant.variable}>
      <OsThemeProvider>{children}</OsThemeProvider>
    </div>
  );
}
