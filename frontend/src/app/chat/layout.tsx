import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("auth")?.value === "1";
  if (!isLoggedIn) {
    redirect("/login?from=/chat");
  }
  return <>{children}</>;
}


