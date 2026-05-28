import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7c600] p-4">
      <Suspense
        fallback={
          <div className="h-48 w-full max-w-md animate-pulse rounded-[32px] bg-[#0b0f1a]/60" />
        }
      >
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
