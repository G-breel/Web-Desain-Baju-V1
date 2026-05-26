"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { registerAction } from "@/app/actions/auth";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type FormState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: FormState = {};

export function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData) => {
      const result = await registerAction(formData);
      return result ?? initialState;
    },
    initialState
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success && state.message) {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <Card className="w-full max-w-md">
      <CardTitle className="text-2xl">Daftar</CardTitle>
      <CardDescription className="mt-2">
        Buat akun gratis — tanpa pembayaran
      </CardDescription>

      <form action={formAction} className="mt-8 space-y-4">
        <Input
          label="Username"
          name="username"
          type="text"
          placeholder="namamu"
          autoComplete="username"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Min. 6 karakter"
          autoComplete="new-password"
          minLength={6}
          required
        />

        <div className="relative">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-900/60">
              <LoadingSpinner />
            </div>
          )}
          <Button type="submit" className="w-full" size="lg">
            Daftar
          </Button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-2 text-zinc-500">atau</span>
        </div>
      </div>

      <GoogleAuthButton redirectTo={redirectTo} />

      <p className="mt-6 text-center text-sm text-zinc-400">
        Sudah punya akun?{" "}
        <Link
          href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-violet-400 hover:text-violet-300"
        >
          Masuk
        </Link>
      </p>
    </Card>
  );
}
