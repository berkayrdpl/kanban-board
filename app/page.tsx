import { redirect } from "next/navigation";

/**
 * Landing page — middleware already redirects unauthenticated users to /login
 * and authenticated users from "/" to /boards. This is just a fallback.
 */
export default function Home() {
  redirect("/login");
}
