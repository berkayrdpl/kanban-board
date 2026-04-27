import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BoardNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-3xl font-semibold">Board bulunamadı</h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Aradığın board silinmiş olabilir ya da sana ait değil. Listeye dönüp
        kontrol et.
      </p>
      <Button asChild>
        <Link href="/boards">Board listesine dön</Link>
      </Button>
    </main>
  );
}
