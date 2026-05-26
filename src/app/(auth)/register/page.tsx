import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
