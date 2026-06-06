import OsShellClient from "@/components/os/OsShellClient";
import OsDashboardView from "@/components/os/OsDashboardView";

export default function OsDashboardPage() {
  return (
    <OsShellClient>
      <OsDashboardView />
    </OsShellClient>
  );
}
