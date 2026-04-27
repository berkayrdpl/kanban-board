"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BoardActionState = { error?: string };

/**
 * Create a new board for the current user.
 * RLS guarantees `owner_id = auth.uid()`, but we set it explicitly so
 * server-side validation is independent of the policy.
 */
export async function createBoardAction(
  _prev: BoardActionState,
  formData: FormData,
): Promise<BoardActionState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Başlık zorunlu." };
  if (title.length > 120) return { error: "Başlık çok uzun (max 120)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data, error } = await supabase
    .from("boards")
    .insert({ title, owner_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/boards");
  redirect(`/boards/${data.id}`);
}

export async function renameBoardAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;

  const supabase = await createClient();
  await supabase.from("boards").update({ title }).eq("id", id);
  revalidatePath("/boards");
  revalidatePath(`/boards/${id}`);
}

export async function deleteBoardAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("boards").delete().eq("id", id);
  revalidatePath("/boards");
  redirect("/boards");
}

/**
 * Toggle public sharing for a board.
 *   - If `share_token` is null → generate a new uuid and store it.
 *   - If non-null → clear it (revoke).
 *
 * Returns the new token (or null after revoke). Token is unguessable (UUID v4),
 * so anyone with the URL can read the board; no one without it can.
 */
export async function toggleBoardShareAction(
  boardId: string,
): Promise<{ token: string | null; error?: string }> {
  if (!boardId) return { token: null, error: "Board id eksik." };

  const supabase = await createClient();

  // Read current token (RLS scopes this to the owner)
  const { data: current, error: readErr } = await supabase
    .from("boards")
    .select("share_token")
    .eq("id", boardId)
    .single();

  if (readErr) return { token: null, error: readErr.message };

  const next = current?.share_token
    ? null
    : crypto.randomUUID();

  const { error: writeErr } = await supabase
    .from("boards")
    .update({ share_token: next })
    .eq("id", boardId);

  if (writeErr) return { token: null, error: writeErr.message };

  revalidatePath(`/boards/${boardId}`);
  return { token: next };
}
