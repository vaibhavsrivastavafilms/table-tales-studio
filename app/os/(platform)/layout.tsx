import OsShellClient from "@/components/os/OsShellClient";

export default function OsPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OsShellClient>{children}</OsShellClient>;
}
