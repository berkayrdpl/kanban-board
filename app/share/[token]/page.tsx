import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SharedCard = {
  id: string;
  title: string;
  description: string | null;
  position: number;
};

type SharedColumn = {
  id: string;
  title: string;
  position: number;
  cards: SharedCard[];
};

type SharedBoard = {
  id: string;
  title: string;
  columns: SharedColumn[];
};

/**
 * Public, read-only board view via share token.
 *
 * - No auth required (middleware whitelists `/share/`).
 * - Calls `public.get_shared_board(p_token)` RPC, which is the only way
 *   anonymous callers can read board data; the function bypasses RLS but
 *   filters by the supplied token.
 * - Returns 404 if the token doesn't match any board (revoked or invalid).
 */
export default async function SharedBoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Basic shape check — prevent malformed UUIDs from hitting the DB.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    );
  if (!isUuid) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_shared_board", {
    p_token: token,
  });

  if (error) throw new Error(error.message);
  if (!data) notFound();

  const board = data as unknown as SharedBoard;

  return (
    <main className="flex h-screen flex-col p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center gap-3 border-b pb-4">
        <div className="flex flex-1 items-center gap-3">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {board.title}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Eye className="h-3 w-3" />
            Salt-okunur
          </span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Giriş yap</Link>
        </Button>
      </header>

      <div className="board-scroll -mx-4 flex flex-1 items-start gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {board.columns.length === 0 ? (
          <p className="m-auto text-sm text-muted-foreground">
            Bu board'da henüz sütun yok.
          </p>
        ) : (
          board.columns.map((col) => (
            <section
              key={col.id}
              className="flex w-[280px] shrink-0 flex-col rounded-lg border bg-muted/40 p-3 sm:w-72"
            >
              <div className="mb-3 flex items-center gap-2">
                <h2 className="flex-1 truncate text-sm font-semibold">
                  {col.title}
                </h2>
                <span className="rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
                  {col.cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {col.cards.length === 0 ? (
                  <p className="rounded-md border border-dashed bg-background/50 p-3 text-center text-xs text-muted-foreground">
                    Boş
                  </p>
                ) : (
                  col.cards.map((card) => (
                    <article
                      key={card.id}
                      className="rounded-md border bg-background p-2 text-sm shadow-sm"
                    >
                      <p className="line-clamp-3 font-medium">{card.title}</p>
                      {card.description ? (
                        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                          {card.description}
                        </p>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
