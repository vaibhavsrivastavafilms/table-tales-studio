"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearDraft } from "@/lib/draftStorage";
import { logMonitoring } from "@/lib/monitoring";
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type SidebarProps = {
  onLogout?: () => void;
};

export default function Sidebar({ onLogout }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      clearDraft();
      logMonitoring("auth_logout", "info");
    }
    onLogout?.();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden h-full rounded-3xl border border-zinc-800 bg-[#111111] p-5 xl:block">
      <h2 className="mb-10 text-2xl font-bold xl:text-3xl">
        Table Tales Studio
      </h2>

      <nav className="space-y-6 text-zinc-400">
        <Link
          href="/dashboard"
          className="block transition-colors duration-200 hover:text-white"
        >
          Projects
        </Link>
        <Link
          href="/dashboard/demo"
          className="block transition-colors duration-200 hover:text-white"
        >
          Sample demo
        </Link>
        <Link
          href="/pricing"
          className="block transition-colors duration-200 hover:text-white"
        >
          Pricing
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="block text-left transition-colors duration-200 hover:text-[#f7c600]"
        >
          Log out
        </button>
      </nav>
    </aside>
  );
}
