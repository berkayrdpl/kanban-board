import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { NewBoardForm } from "@/components/boards/new-board-form";
import { BoardListItem } from "@/components/boards/board-list-item";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: boards, error } = await supabase
    .from("boards")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Board'larım</h1>
          <p className="text-sm text-muted-foreground">
            Hoş geldin, {user.email}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline" size="sm">
            Çıkış
          </Button>
        </form>
      </header>

      <section className="mb-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Yeni board</h2>
        <NewBoardForm />
      </section>

      <section>
        {error ? (
          <p className="text-sm text-destructive">
            Boards yüklenemedi: {error.message}
          </p>
        ) : boards && boards.length > 0 ? (
          <ul className="space-y-2">
            {boards.map((b) => (
              <BoardListItem
                key={b.id}
                id={b.id}
                title={b.title}
                createdAt={b.created_at}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Henüz board yok. Yukarıdan ilk board'unu oluştur.
          </div>
        )}
      </section>
    </main>
  );
}
