import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ShareNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-3xl font-semibold">Paylaşım linki geçersiz</h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Bu link silinmiş veya hiç oluşturulmamış olabilir. Board'un sahibinden
        yeni bir link iste ya da kendi hesabınla giriş yap.
      </p>
      <Button asChild>
        <Link href="/login">Giriş yap</Link>
      </Button>
    </main>
  );
}
