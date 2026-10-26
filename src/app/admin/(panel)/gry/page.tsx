import type { Metadata } from "next";
import Link from "next/link";
import { widziWszystko, wymagajAdmina } from "@/lib/admin";
import { filtrGier } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FiltrLokali, wybranyLokal, type LokalAutor } from "../_komponenty/lokale-autorzy";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "./lista-gier";

export const metadata: Metadata = { title: "Rozgrywki · Bractwo Quiz" };

export default async function Gry({ searchParams }: PageProps<"/admin/gry">) {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();
  // główny filtruje gry po lokalu (26.10); lokal i tak widzi tylko swoje
  const { data: lokale } = widziWszystko(rola)
    ? await db.from("lokale").select("id, nazwa, logo_url").order("nazwa").returns<LokalAutor[]>()
    : { data: [] as LokalAutor[] };
  const lokal = wybranyLokal((await searchParams).lokal, lokale ?? [], false);
  let zapytanie = filtrGier(db.from("sesje").select(ZAPYTANIE_GIER), rola);
  if (lokal) zapytanie = zapytanie.eq("lokal_id", lokal);
  const { data, error } = await zapytanie.order("utworzono", { ascending: false }).limit(100).returns<GraNaLiscie[]>();

  const gry = data ?? [];
  return (
    <main>
      <h1>Rozgrywki</h1>
      <p>
        <Link href="/admin/gry/nowa" className="przycisk zloty">
          ▶ Uruchom quiz
        </Link>
      </p>
      <FiltrLokali lokale={lokale ?? []} wybrany={lokal} adres={(l) => (l ? `/admin/gry?lokal=${l}` : "/admin/gry")} />
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
