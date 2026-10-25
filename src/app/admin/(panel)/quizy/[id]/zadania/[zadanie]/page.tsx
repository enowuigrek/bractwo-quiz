import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Etap, Quiz, Zadanie } from "@/lib/typy";
import { EdytorZadania } from "../edytor";

export const metadata: Metadata = { title: "Pytanie · Bractwo Quiz" };

/** `/admin/quizy/[id]/zadania/nowe` dodaje pytanie, a z identyfikatorem edytuje istniejące. */
export default async function StronaZadania({
  params,
  searchParams,
}: PageProps<"/admin/quizy/[id]/zadania/[zadanie]">) {
  const rola = await wymagajAdmina();
  const { id, zadanie: zadanieId } = await params;
  await wymagajQuizu(rola, id);
  // `?etap=<id>`: nowe pytanie w tym etapie (z listy pytań albo po „Dodaj i następne”)
  const { etap: etapZAdresu } = await searchParams;
  const db = supabaseAdmin();
  const nowe = zadanieId === "nowe";

  const [{ data: quiz }, { data: zadanie }, { data: etapy }] = await Promise.all([
    db.from("quizy").select("id, tytul").eq("id", id).maybeSingle<Pick<Quiz, "id" | "tytul">>(),
    nowe
      ? Promise.resolve({ data: null })
      : db.from("zadania").select("*").eq("id", zadanieId).eq("quiz_id", id).maybeSingle<Zadanie>(),
    db.from("etapy").select("*").eq("quiz_id", id).order("nr").returns<Etap[]>(),
  ]);
  if (!quiz || (!nowe && !zadanie)) notFound();
  const lista = etapy ?? [];
  const wybrany = lista.find((e) => e.id === etapZAdresu) ?? lista.at(-1) ?? null;
  // quiz bez etapów (klasyczny): nowe pytanie ma rodzaj ostatniego pytania, dopóki prowadzący go nie zmieni
  const { data: ostatnie } =
    nowe && !wybrany
      ? await db
          .from("zadania")
          .select("typ")
          .eq("quiz_id", id)
          .neq("typ", "ciekawostka")
          .order("nr", { ascending: false })
          .limit(1)
          .maybeSingle<Pick<Zadanie, "typ">>()
      : { data: null };

  return (
    <main>
      <p className="okruchy">
        <Link href={`/admin/quizy/${quiz.id}`}>← {quiz.tytul}</Link>
      </p>
      <h1>{nowe ? (wybrany ? `Nowe pytanie: ${wybrany.nazwa}` : "Nowe pytanie") : "Edycja pytania"}</h1>
      <section className="karta">
        <EdytorZadania
          quizId={quiz.id}
          zadanie={zadanie ?? undefined}
          etapy={lista}
          domyslnyEtap={wybrany?.id ?? null}
          domyslnyTyp={wybrany?.typ_domyslny ?? ostatnie?.typ ?? undefined}
        />
      </section>
    </main>
  );
}
