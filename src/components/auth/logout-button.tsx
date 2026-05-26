"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
      className="w-full justify-start gap-2 text-zinc-400 hover:text-red-400"
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Keluar..." : "Keluar"}
    </Button>
  );
}
