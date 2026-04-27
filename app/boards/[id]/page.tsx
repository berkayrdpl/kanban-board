import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoardHeader } from "@/components/board-detail/board-header";
import { BoardView } from "@/components/board-detail/board-view";
import type { Card as CardType } from "@/types/database";

export const dynamic = "force-dynamic";

type ColumnState = {
  id: string;
  title: string;
  position: number;
  cards: CardType[];
};

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: board, error: boardErr } = await supabase
    .from("boards")
    .select("id, title, owner_id, share_token")
    .eq("id", id)
    .maybeSingle();

  if (boardErr) throw new Error(boardErr.message);
  if (!board) notFound();

  const { data: columnsRaw, error: colsErr } = await supabase
    .from("columns")
    .select(
      "id, title, position, cards(id, column_id, title, description, position, created_at, updated_at)",
    )
    .eq("board_id", id)
    .order("position", { ascending: true });

  if (colsErr) throw new Error(colsErr.message);

  // Postgres'in nested embed'i kart sırasını garanti etmez —
  // client'ta her sütunun kartlarını position ASC'ye göre sırala.
  const columns: ColumnState[] = (columnsRaw ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    position: c.position,
    cards: ((c.cards as CardType[] | null) ?? []).sort(
      (a, b) => a.position - b.position,
    ),
  }));

  return (
    <main className="flex h-screen flex-col p-4 sm:p-6">
      <BoardHeader
        id={board.id}
        title={board.title}
        shareToken={board.share_token ?? null}
      />
      <BoardView boardId={board.id} initialColumns={columns} />
    </main>
  );
}
