import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OsThemeProvider } from "@/components/os/OsThemeProvider";
import TableTalesLogo from "@/components/brand/TableTalesLogo";
import { Button } from "@/components/ui/button";
import { getOsSession } from "@/lib/os/auth/server";
import { isOsDevAuthBypass } from "@/lib/os/auth/dev-bypass";
import { isSupabaseConfigured } from "@/lib/supabase";
import { OsLoginForm } from "@/components/os/OsLoginForm";
import { signInWithEmail } from "@/lib/os/auth/actions";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function OsLoginPage() {
  const devBypass = isOsDevAuthBypass();
  const configured = isSupabaseConfigured();

  if (devBypass && !configured) {
    return (
      <OsThemeProvider>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="mx-auto flex justify-center">
                <TableTalesLogo size="md" priority />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                Development Mode Active
              </h1>
              <p className="mt-2 text-sm text-[var(--os-fg-muted)]">
                Supabase login is bypassed locally while database migration is in
                progress.
              </p>
            </div>

            <div className="os-card space-y-4 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                DEV MODE – AUTH BYPASSED
              </p>
              <Button asChild className="w-full">
                <Link href="/os">Enter Table Tales OS</Link>
              </Button>
            </div>

            <p className="text-center text-xs text-[var(--os-fg-subtle)]">
              <Link href="/" className="underline-offset-4 hover:underline">
                Back to Table Tales Studio
              </Link>
            </p>
          </div>
        </div>
      </OsThemeProvider>
    );
  }

  const session = await getOsSession();
  if (session) {
    redirect("/os");
  }

  return (
    <OsThemeProvider>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto flex justify-center">
              <TableTalesLogo size="md" priority />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Table Tales OS
            </h1>
            <p className="mt-2 text-sm text-[var(--os-fg-muted)]">
              Sign in to your hospitality operations workspace
            </p>
          </div>

          {configured ? (
            <OsLoginForm signIn={signInWithEmail} />
          ) : (
            <div className="os-card space-y-4 p-6 text-center">
              <p className="text-sm text-[var(--os-fg-muted)]">
                Supabase is not configured. You can explore the OS shell without
                authentication in local development.
              </p>
              <Button asChild className="w-full">
                <Link href="/os">Continue to OS shell</Link>
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-[var(--os-fg-subtle)]">
            <Link href="/" className="underline-offset-4 hover:underline">
              Back to Table Tales Studio
            </Link>
          </p>
        </div>
      </div>
    </OsThemeProvider>
  );
}
