"use client";

import { Toaster } from "sonner";

/**
 * Thin client-component wrapper around sonner's Toaster.
 *
 * Why a wrapper? Importing `<Toaster />` directly into a Server Component
 * layout works in most builds, but some Next.js / sonner combinations end
 * up bundling client-only code into the server payload and surface an
 * "unexpected response was received from the server" runtime error.
 * Drawing the boundary explicitly here avoids that.
 */
export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border bg-background text-foreground",
        },
      }}
    />
  );
}
