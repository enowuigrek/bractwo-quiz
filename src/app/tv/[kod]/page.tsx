import { redirect } from "next/navigation";

/** Stare linki /tv/KOD prowadzą do /ekran/KOD (z parametrami, np. `?prosty`). */
export default async function StaryTv({ params, searchParams }: PageProps<"/tv/[kod]">) {
  const { kod } = await params;
  const zapytanie = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    for (const w of Array.isArray(v) ? v : [v ?? ""]) zapytanie.append(k, w);
  }
  const reszta = zapytanie.toString().replace(/=(&|$)/g, "$1");
  redirect(`/ekran/${encodeURIComponent(kod)}${reszta ? `?${reszta}` : ""}`);
}
