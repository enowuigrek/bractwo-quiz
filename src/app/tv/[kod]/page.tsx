import { redirect } from "next/navigation";

/** Stare linki /tv/KOD prowadzą do /ekran/KOD. */
export default async function StaryTv({ params }: PageProps<"/tv/[kod]">) {
  const { kod } = await params;
  redirect(`/ekran/${encodeURIComponent(kod)}`);
}
