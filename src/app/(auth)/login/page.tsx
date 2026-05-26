import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
