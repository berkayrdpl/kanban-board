import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Logout endpoint — POST to it from a small <form> in the boards UI.
 * Using a route handler (not a server action) so we can keep the form
 * markup in a server component without "use client".
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
