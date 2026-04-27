"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPositionAfterLast } from "@/lib/positions";

/**
 * Column-level mutations for a single board. RLS enforces ownership; we still
 * pre-check the board exists and read columns to compute the next position.
 */

export async function createColumnAction(formData: FormData) {
  const boardId = String(formData.get("board_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!boardId || !title) return;

  const supabase = await createClient();

  // Read existing positions in this board to compute the next slot.
  const { data: existing } = await supabase
    .from("columns")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  const position = getPositionAfterLast(existing ?? []);

  await supabase.from("columns").insert({
    board_id: boardId,
    title,
    position,
  });

  revalidatePath(`/boards/${boardId}`);
}

export async function renameColumnAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const boardId = String(formData.get("board_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;

  const supabase = await createClient();
  await supabase.from("columns").update({ title }).eq("id", id);
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function deleteColumnAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const boardId = String(formData.get("board_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // ON DELETE CASCADE in SQL takes care of cards.
  await supabase.from("columns").delete().eq("id", id);
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

// ============================================================
// Card mutations
// ============================================================

export async function createCardAction(formData: FormData) {
  const columnId = String(formData.get("column_id") ?? "");
  const boardId = String(formData.get("board_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!columnId || !title) return;

  const supabase = await createClient();

  // Compute next position within the column
  const { data: existing } = await supabase
    .from("cards")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: true });

  const position = getPositionAfterLast(existing ?? []);

  await supabase.from("cards").insert({
    column_id: columnId,
    title,
    position,
  });

  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function updateCardAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const boardId = String(formData.get("board_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  if (!id || !title) return;

  const supabase = await createClient();
  await supabase
    .from("cards")
    .update({
      title,
      description: description.length > 0 ? description : null,
    })
    .eq("id", id);

  if (boardId) revalidatePath(`/boards/${boardId}`);
}

export async function deleteCardAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const boardId = String(formData.get("board_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("cards").delete().eq("id", id);
  if (boardId) revalidatePath(`/boards/${boardId}`);
}

/**
 * Move a card: change its column and/or position. Called by drag-and-drop.
 *
 * Notes:
 *   - We DON'T revalidatePath here: the client owns the source of truth
 *     during/after drags (BoardView). If we revalidated, the page would
 *     re-render mid-flight and could fight the optimistic state.
 *   - RLS still applies: only the board owner can update.
 *   - The single UPDATE is intentional — we exploit float positions so
 *     siblings stay untouched.
 */
export async function moveCardAction(formData: FormData): Promise<{ error?: string }> {
  const id = String(formData.get("id") ?? "");
  const columnId = String(formData.get("column_id") ?? "");
  const positionStr = String(formData.get("position") ?? "");
  const position = Number(positionStr);
  if (!id || !columnId || !Number.isFinite(position)) {
    return { error: "Geçersiz parametre." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cards")
    .update({ column_id: columnId, position })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}
