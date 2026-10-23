import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { widoczne } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "./lista-gier";

export const metadata: Metadata = { title: "Rozgrywki · Bractwo Quiz" };

export default async function Gry() {
  const rola = await wymagajAdmina();
  const { data, error } = await supabaseAdmin()
    .from("sesje")
    .select(ZAPYTANIE_GIER)
    .in("tylko_glowny", widoczne(rola))
    .order("utworzono", { ascending: false })
    .limit(100)
    .returns<GraNaLiscie[]>();

  const gry = data ?? [];
  return (
    <main>
      <h1>Rozgrywki</h1>
      <p>
        <Link href="/admin/gry/nowa" className="przycisk zloty">
          ▶ Uruchom quiz
        </Link>
      </p>
      {error && <p className="blad">Nie udało się pobrać rozgrywek: {error.message}</p>}

      <section className="panel-sekcja">
        <h2>Trwające</h2>
        <ListaGier gry={gry.filter((g) => g.faza !== "koniec")} pusta="Żadna rozgrywka teraz nie trwa." />
      </section>
      <section className="panel-sekcja">
        <h2>Zakończone</h2>
        <ListaGier gry={gry.filter((g) => g.faza === "koniec")} pusta="Nie ma jeszcze zakończonych rozgrywek." />
      </section>
    </main>
  );
}
