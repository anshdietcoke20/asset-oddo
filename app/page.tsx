import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/session";

export default async function RootPage() {
  const session = await getSessionPayload();
  redirect(session ? "/dashboard" : "/login");
}
