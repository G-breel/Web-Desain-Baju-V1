"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "glass border border-white/10 bg-zinc-900/90 text-zinc-100 shadow-xl backdrop-blur-xl",
          },
        }}
      />
    </ThemeProvider>
  );
}
