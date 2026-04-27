"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BoardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[boards] error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Bir şeyler ters gitti</h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Board listesi yüklenemedi. Birkaç saniye sonra tekrar dene.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Tekrar dene</Button>
        <Button asChild variant="outline">
          <Link href="/login">Çıkış</Link>
        </Button>
      </div>
    </main>
  );
}
