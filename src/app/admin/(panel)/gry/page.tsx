import type { Metadata } from "next";
import Link from "next/link";
import { lokalRoli, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { filtrGier } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FiltrTematow, ZakladkiRodzaju } from "../_komponenty/filtry-listy";
import { FiltrLokali, wybranyLokal, type LokalAutor } from "../_komponenty/lokale-autorzy";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "./lista-gier";
import { wszystkieTagi, type RodzajQuizu } from "@/lib/tagi";

export const metadata: Metadata = { title: "Rozgrywki · Bractwo Quiz" };

export default async function Gry({ searchParams }: PageProps<"/admin/gry">) {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();
  // główny filtruje gry po lokalu (26.10); lokal i tak widzi tylko swoje
  const { data: lokale } = widziWszystko(rola)
    ? await db.from("lokale").select("id, nazwa, logo_url").order("nazwa").returns<LokalAutor[]>()
    : { data: [] as LokalAutor[] };
  const { lokal: lokalZAdresu, rodzaj: rodzajZAdresu, tag } = await searchParams;
  const lokal = wybranyLokal(lokalZAdresu, lokale ?? [], false);
  // ten sam układ co lista quizów (29.10): rodzaj quizu, a pod nim filtry „Kto” i „Temat”
  const rodzaj: RodzajQuizu = rodzajZAdresu === "klasyczny" ? "klasyczny" : "wyscig";
  let zapytanie = filtrGier(db.from("sesje").select(ZAPYTANIE_GIER), rola, true);
  const jakoLokal = !!lokalRoli(rola);
  if (lokal) zapytanie = zapytanie.eq("lokal_id", lokal);
  const { data, error } = await zapytanie.order("utworzono", { ascending: false }).limit(100).returns<GraNaLiscie[]>();

  const wRodzaju = (data ?? []).filter(
    (g) => ((g.quizy?.etapy[0]?.count ?? 0) > 0 ? "wyscig" : "klasyczny") === rodzaj,
  );
  const tagi = wszystkieTagi(wRodzaju.map((g) => ({ tagi: g.quizy?.tagi ?? [] })));
  const wybranyTag = typeof tag === "string" && tagi.includes(tag) ? tag : null;
  const gry = wybranyTag ? wRodzaju.filter((g) => g.quizy?.tagi.includes(wybranyTag)) : wRodzaju;
  const adres = (r: RodzajQuizu, t: string | null = null, l: string | null = lokal) =>
    `/admin/gry?${new URLSearchParams({
      ...(r === "klasyczny" ? { rodzaj: r } : {}),
      ...(t ? { tag: t } : {}),
      ...(l ? { lokal: l } : {}),
    })}`;
  const trwajace = gry.filter((g) => g.faza !== "koniec");
  const zakonczone = gry.filter((g) => g.faza === "koniec");
  return (
    <main>
      {/* ten sam układ co „Quizy”, żeby przy przełączaniu zakładek nic nie skakało; na komputerze „Uruchom quiz”
          stoi w pasku nawigacji, więc przycisk w nagłówku tylko na telefonie */}
      <div className="naglowek-strony">
        <h1>Rozgrywki</h1>
        <Link href="/admin/gry/nowa" className="przycisk-maly zloty tylko-telefon">
          ▶ Uruchom quiz
        </Link>
      </div>
      <ZakladkiRodzaju rodzaj={rodzaj} adres={(r) => adres(r)} />
      <div className="filtry">
        <FiltrLokali lokale={lokale ?? []} wybrany={lokal} adres={(l) => adres(rodzaj, wybranyTag, l)} />
        <FiltrTematow tagi={tagi} wybrany={wybranyTag} adres={(t) => adres(rodzaj, t)} />
      </div>
      {error && <p className="blad">Nie udało się pobrać rozgrywek: {error.message}</p>}

      <section className="panel-sekcja">
        <h2 className="naglowek-z-licznikiem">
          Trwające <span className="licznik">{trwajace.length}</span>
        </h2>
        <ListaGier gry={trwajace} pusta="Żadna rozgrywka teraz nie trwa." lokal={jakoLokal} />
      </section>
      <section className="panel-sekcja">
        <h2 className="naglowek-z-licznikiem">
          Zakończone <span className="licznik">{zakonczone.length}</span>
        </h2>
        <ListaGier gry={zakonczone} pusta="Nie ma jeszcze zakończonych rozgrywek." lokal={jakoLokal} />
      </section>
    </main>
  );
}
