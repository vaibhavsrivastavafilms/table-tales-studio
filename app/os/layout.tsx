import type { Metadata } from "next";
import { OsThemeProvider } from "@/components/os/OsThemeProvider";
import "./os.css";

export const metadata: Metadata = {
  title: {
    default: "Table Tales OS",
    template: "%s · Table Tales OS",
  },
  description: "Hospitality operations platform for restaurants and food brands.",
};

export default function OsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OsThemeProvider>{children}</OsThemeProvider>;
}
