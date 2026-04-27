"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Column } from "./column";
import { NewColumnForm } from "./new-column-form";
import { CardItem } from "./card-item";
import { moveCardAction } from "@/app/boards/[id]/actions";
import { getPositionForIndex } from "@/lib/positions";
import type { Card as CardType } from "@/types/database";

type ColumnState = {
  id: string;
  title: string;
  position: number;
  cards: CardType[];
};

type Props = {
  boardId: string;
  initialColumns: ColumnState[];
};

/**
 * Heart of the board: owns columns + cards state, hosts DndContext, and turns
 * drag gestures into a single UPDATE per move (column_id + position).
 *
 * State lifecycle
 * ---------------
 * - Initial state comes from server (props.initialColumns).
 * - When OTHER mutations (add/edit/delete card or column) revalidate the page,
 *   `initialColumns` changes. We sync state from props, but ONLY when no drag
 *   is active — otherwise we'd fight the optimistic state mid-flight.
 * - `moveCardAction` deliberately does NOT revalidate; the next mutation that
 *   does will pick up the persisted move.
 *
 * Cancellation
 * ------------
 * On drag start we snapshot the columns. If the drag is cancelled (Esc, or
 * server failure), we restore the snapshot.
 */
export function BoardView({ boardId, initialColumns }: Props) {
  const [columns, setColumns] = useState<ColumnState[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const snapshotRef = useRef<ColumnState[] | null>(null);

  // Stable id avoids the dnd-kit SSR hydration mismatch:
  // without it, DndContext's accessibility announcer auto-increments a
  // counter ("DndDescribedBy-0", "-2", …) which can drift between server
  // render and client hydration (especially with HMR).
  const dndId = useId();

  // Sync from server when props change AND no drag is in flight.
  useEffect(() => {
    if (!activeCard && !snapshotRef.current) {
      setColumns(initialColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialColumns]);

  const sensors = useSensors(
    // Mouse / pen / generic pointer.
    // `distance: 8` lets short clicks pass through to the card's onClick
    // (which opens the dialog) and only starts a drag after 8 px of movement.
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    // Touch — long-press to disambiguate from page scroll.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    // Keyboard accessibility (arrows + space).
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ---------- helpers ----------

  function findCard(
    cols: ColumnState[],
    cardId: string,
  ): { columnIndex: number; cardIndex: number; card: CardType } | null {
    for (let ci = 0; ci < cols.length; ci++) {
      const idx = cols[ci].cards.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        return { columnIndex: ci, cardIndex: idx, card: cols[ci].cards[idx] };
      }
    }
    return null;
  }

  function isColumnId(cols: ColumnState[], id: string): boolean {
    return cols.some((c) => c.id === id);
  }

  // ---------- handlers ----------

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const loc = findCard(columns, id);
    if (!loc) return;
    snapshotRef.current = columns;
    setActiveCard(loc.card);
  }

  /**
   * Cross-column moves happen here so the user sees the card lifted into the
   * target column while still holding it. Same-column reordering is left to
   * onDragEnd (lower visual cost — `verticalListSortingStrategy` already
   * provides the slide animation in place).
   */
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setColumns((prev) => {
      const activeLoc = findCard(prev, activeId);
      if (!activeLoc) return prev;

      // Resolve the target column.
      let targetColIdx: number;
      let targetIndex: number;

      if (isColumnId(prev, overId)) {
        // Hovering over a column body (often empty area). Append to the end.
        targetColIdx = prev.findIndex((c) => c.id === overId);
        targetIndex = prev[targetColIdx].cards.length;
      } else {
        // Hovering over another card.
        const overLoc = findCard(prev, overId);
        if (!overLoc) return prev;
        targetColIdx = overLoc.columnIndex;
        targetIndex = overLoc.cardIndex;
      }

      // Same column → leave the visual swapping to the SortableContext
      // strategy, defer real index changes to onDragEnd.
      if (activeLoc.columnIndex === targetColIdx) return prev;

      // Cross-column: extract from source, insert into target.
      const next = prev.map((col) => ({ ...col, cards: [...col.cards] }));
      const [moved] = next[activeLoc.columnIndex].cards.splice(
        activeLoc.cardIndex,
        1,
      );
      // The moved card now belongs to the new column — keep that in state
      // so `findCard` works correctly on subsequent drag-over ticks.
      const movedUpdated: CardType = {
        ...moved,
        column_id: next[targetColIdx].id,
      };
      next[targetColIdx].cards.splice(targetIndex, 0, movedUpdated);
      return next;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      // Dropped outside any droppable — revert.
      if (snapshotRef.current) setColumns(snapshotRef.current);
      snapshotRef.current = null;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    // Compute the FINAL arrangement first, then derive the position from it.
    const finalColumns: ColumnState[] = (() => {
      const current = columns.map((col) => ({ ...col, cards: [...col.cards] }));
      const activeLoc = findCard(current, activeId);
      if (!activeLoc) return current;

      // Same-column reorder happens here.
      if (!isColumnId(current, overId)) {
        const overLoc = findCard(current, overId);
        if (
          overLoc &&
          overLoc.columnIndex === activeLoc.columnIndex &&
          overLoc.cardIndex !== activeLoc.cardIndex
        ) {
          const col = current[activeLoc.columnIndex];
          col.cards = arrayMove(
            col.cards,
            activeLoc.cardIndex,
            overLoc.cardIndex,
          );
        }
      }
      return current;
    })();

    // Locate the active card in the final arrangement.
    const finalLoc = findCard(finalColumns, activeId);
    if (!finalLoc) {
      snapshotRef.current = null;
      return;
    }

    const targetColumn = finalColumns[finalLoc.columnIndex];
    const siblings = targetColumn.cards.filter((c) => c.id !== activeId);
    const newPosition = getPositionForIndex(siblings, finalLoc.cardIndex);

    // Reflect new position in state (so subsequent moves use it).
    targetColumn.cards = targetColumn.cards.map((c) =>
      c.id === activeId
        ? { ...c, column_id: targetColumn.id, position: newPosition }
        : c,
    );
    setColumns(finalColumns);

    // Persist.
    const fd = new FormData();
    fd.set("id", activeId);
    fd.set("column_id", targetColumn.id);
    fd.set("position", String(newPosition));
    fd.set("board_id", boardId);

    const res = await moveCardAction(fd);
    if (res.error) {
      // Server rejected → revert and surface error.
      if (snapshotRef.current) setColumns(snapshotRef.current);
      toast.error("Kart taşınamadı", { description: res.error });
    }
    snapshotRef.current = null;
  }

  function handleDragCancel() {
    if (snapshotRef.current) setColumns(snapshotRef.current);
    snapshotRef.current = null;
    setActiveCard(null);
  }

  // ---------- render ----------

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="board-scroll -mx-4 flex flex-1 items-start gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            boardId={boardId}
            title={col.title}
            cards={col.cards}
          />
        ))}
        <NewColumnForm boardId={boardId} />
      </div>

      <DragOverlay dropAnimation={{ duration: 200 }}>
        {activeCard ? (
          <div className="rotate-2 opacity-95 shadow-xl">
            <CardItem card={activeCard} boardId={boardId} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
