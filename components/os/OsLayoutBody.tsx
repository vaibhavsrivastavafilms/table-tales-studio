import OsLayoutBodyClient from "@/components/os/OsLayoutBodyClient";
import { getOsSession } from "@/lib/os/auth/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export default async function OsLayoutBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOsSession();

  return (
    <OsLayoutBodyClient
      session={session}
      supabaseConfigured={isSupabaseConfigured()}
    >
      {children}
    </OsLayoutBodyClient>
  );
}
