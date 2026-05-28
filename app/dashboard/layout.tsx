import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function isPublicDashboardPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/demo" ||
    pathname.startsWith("/dashboard/demo/") ||
    pathname === "/dashboard/local" ||
    pathname.startsWith("/dashboard/local/")
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    const pathname = (await headers()).get("x-pathname") ?? "";

    if (pathname && !isPublicDashboardPath(pathname)) {
      try {
        const supabase = await createServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          redirect("/dashboard/local?auth=required");
        }
      } catch {
        redirect("/dashboard/local?auth=required");
      }
    }
  }

  return <>{children}</>;
}
