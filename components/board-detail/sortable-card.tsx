"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardItem } from "./card-item";
import type { Card as CardType } from "@/types/database";

/**
 * Wraps CardItem in a useSortable container.
 *
 * Click vs drag: PointerSensor's `activationConstraint: { distance: 8 }`
 * (set in BoardView) means a tap or short click never triggers a drag —
 * the click reaches CardItem's <button> and opens the dialog. Moving 8+ px
 * starts the drag.
 */
export function SortableCard({
  card,
  boardId,
}: {
  card: CardType;
  boardId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardItem card={card} boardId={boardId} />
    </div>
  );
}
