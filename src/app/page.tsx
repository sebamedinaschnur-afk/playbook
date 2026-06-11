import { redirect } from "next/navigation";

// Proxy normally handles "/" redirects; this is a fallback.
export default function RootPage() {
  redirect("/login");
}
