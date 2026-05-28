import { redirect } from "next/navigation";
import DashboardClientShell from "@/components/DashboardClientShell";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/login");
      }
    } catch {
      redirect("/login");
    }
  }

  return <DashboardClientShell>{children}</DashboardClientShell>;
}
