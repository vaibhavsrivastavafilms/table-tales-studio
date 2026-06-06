"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/lib/os/auth/actions";

const DEFAULT_LOGIN_EMAIL = "owner@tabletales.local";

type OsLoginFormProps = {
  signIn: (
    prev: AuthActionState,
    formData: FormData
  ) => Promise<AuthActionState>;
};

export function OsLoginForm({ signIn }: OsLoginFormProps) {
  const [state, action, pending] = useActionState(signIn, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="os-card space-y-4 p-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={DEFAULT_LOGIN_EMAIL}
          placeholder="owner@tabletales.local"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-red-500" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
