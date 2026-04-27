"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteColumnAction,
  renameColumnAction,
} from "@/app/boards/[id]/actions";
import type { Card as CardType } from "@/types/database";
import { SortableCard } from "./sortable-card";
import { NewCardForm } from "./new-card-form";

type Props = {
  id: string;
  boardId: string;
  title: string;
  cards: CardType[];
};

export function Column({ id, boardId, title, cards }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isPending, startTransition] = useTransition();

  // Whole column is a drop zone — needed so empty columns accept drops
  // and so dragging into the column's gap (between cards) registers.
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "column", columnId: id },
  });

  const cardIds = cards.map((c) => c.id);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setIsEditing(false);
      setDraft(title);
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    fd.set("board_id", boardId);
    fd.set("title", trimmed);
    startTransition(async () => {
      await renameColumnAction(fd);
      setIsEditing(false);
    });
  }

  function remove() {
    const cardCount = cards.length;
    const msg =
      cardCount > 0
        ? `"${title}" sütunu ve içindeki ${cardCount} kart silinecek. Emin misin?`
        : `"${title}" sütunu silinecek. Emin misin?`;
    if (!confirm(msg)) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("board_id", boardId);
    startTransition(async () => {
      await deleteColumnAction(fd);
    });
  }

  return (
    <div
      className={`flex w-[280px] shrink-0 flex-col rounded-lg border bg-muted/40 p-3 transition-colors sm:w-72 ${
        isOver ? "bg-accent/60 ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="mb-3 flex items-center gap-1">
        {isEditing ? (
          <form onSubmit={save} className="flex flex-1 items-center gap-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              maxLength={80}
              disabled={isPending}
              className="h-8 text-sm font-semibold"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={isPending}
              aria-label="Kaydet"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={isPending}
              onClick={() => {
                setIsEditing(false);
                setDraft(title);
              }}
              aria-label="İptal"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <>
            <h3 className="flex-1 truncate text-sm font-semibold">{title}</h3>
            <span className="rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
              {cards.length}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
              aria-label="Yeniden adlandır"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:text-destructive"
              onClick={remove}
              disabled={isPending}
              aria-label="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      <div ref={setNodeRef} className="flex min-h-[24px] flex-col gap-2">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.length === 0 ? (
            <p className="rounded-md border border-dashed bg-background/50 p-3 text-center text-xs text-muted-foreground">
              Henüz kart yok
            </p>
          ) : (
            cards.map((card) => (
              <SortableCard key={card.id} card={card} boardId={boardId} />
            ))
          )}
        </SortableContext>
      </div>

      <NewCardForm columnId={id} boardId={boardId} />
    </div>
  );
}
