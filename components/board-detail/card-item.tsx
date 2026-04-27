"use client";

import { useState } from "react";
import { CardDialog } from "./card-dialog";
import type { Card as CardType } from "@/types/database";

type Props = {
  card: CardType;
  boardId: string;
};

export function CardItem({ card, boardId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group cursor-grab rounded-md border bg-background p-2 text-left text-sm shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <p className="line-clamp-3 font-medium">{card.title}</p>
        {card.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {card.description}
          </p>
        ) : null}
      </button>

      <CardDialog
        card={card}
        boardId={boardId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
