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
