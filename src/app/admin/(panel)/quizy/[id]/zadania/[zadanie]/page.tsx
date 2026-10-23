import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Etap, Quiz, Zadanie } from "@/lib/typy";
import { EdytorZadania } from "../edytor";

export const metadata: Metadata = { title: "Pytanie · Bractwo Quiz" };

/** `/admin/quizy/[id]/zadania/nowe` dodaje pytanie, a z identyfikatorem edytuje istniejące. */
export default async function StronaZadania({ params }: PageProps<"/admin/quizy/[id]/zadania/[zadanie]">) {
  await wymagajAdmina();
  const { id, zadanie: zadanieId } = await params;
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

  return (
    <main>
      <p className="okruchy">
        <Link href={`/admin/quizy/${quiz.id}`}>← {quiz.tytul}</Link>
      </p>
      <h1>{nowe ? "Nowe pytanie" : "Edycja pytania"}</h1>
      <section className="karta">
        <EdytorZadania
          quizId={quiz.id}
          zadanie={zadanie ?? undefined}
          etapy={etapy ?? []}
          domyslnyEtap={etapy?.at(-1)?.id ?? null}
        />
      </section>
    </main>
  );
}
