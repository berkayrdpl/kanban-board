"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[board] error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Board yüklenemedi</h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Beklenmeyen bir hata oluştu. Tekrar dene veya listeye dön.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Tekrar dene</Button>
        <Button asChild variant="outline">
          <Link href="/boards">Listeye dön</Link>
        </Button>
      </div>
    </main>
  );
}
