"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  info?: string;
};

export async function signupAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre zorunlu." };
  }
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı." };
  }

  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase'de "Confirm email" kapalıysa session burada oluşur.
  // Açıksa kullanıcıya mailini doğrulaması gerektiğini söylüyoruz.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/boards");
  }

  return {
    info:
      "Kayıt başarılı. E-posta doğrulaması gerekli olabilir; gelen kutunu kontrol et veya giriş yapmayı dene.",
  };
}
