import type { Metadata } from "next";
import Link from "next/link";
import { lokalRoli, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { filtrGier } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FiltryListy, ZakladkiRodzaju, type WybraneFiltry } from "../_komponenty/filtry-listy";
import { wybraneMiasto, wybranyLokal, type LokalAutor } from "../_komponenty/lokale-autorzy";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "./lista-gier";
import { wszystkieTagi, type RodzajQuizu } from "@/lib/tagi";

export const metadata: Metadata = { title: "Rozgrywki · Bractwo Quiz" };

export default async function Gry({ searchParams }: PageProps<"/admin/gry">) {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();
  // główny filtruje gry po lokalu (26.10); lokal i tak widzi tylko swoje
  const { data: lokale } = widziWszystko(rola)
    ? await db.from("lokale").select("id, nazwa, logo_url, miasto").order("nazwa").returns<LokalAutor[]>()
    : { data: [] as LokalAutor[] };
  const { lokal: lokalZAdresu, rodzaj: rodzajZAdresu, tag, miasto: miastoZAdresu } = await searchParams;
  const miasto = wybraneMiasto(miastoZAdresu, lokale ?? []);
  const lokal = wybranyLokal(lokalZAdresu, lokale ?? [], false, miasto);
  // ten sam układ co lista quizów (29.10): rodzaj quizu, a pod nim filtry „Kto” i „Temat”
  const rodzaj: RodzajQuizu = rodzajZAdresu === "klasyczny" ? "klasyczny" : "wyscig";
  let zapytanie = filtrGier(db.from("sesje").select(ZAPYTANIE_GIER), rola, true);
  const jakoLokal = !!lokalRoli(rola);
  if (lokal) zapytanie = zapytanie.eq("lokal_id", lokal);
  else if (miasto)
    zapytanie = zapytanie.in(
      "lokal_id",
      (lokale ?? []).filter((l) => l.miasto === miasto).map((l) => l.id),
    );
  const { data, error } = await zapytanie.order("utworzono", { ascending: false }).limit(100).returns<GraNaLiscie[]>();

  const wRodzaju = (data ?? []).filter(
    (g) => ((g.quizy?.etapy[0]?.count ?? 0) > 0 ? "wyscig" : "klasyczny") === rodzaj,
  );
  const tagi = wszystkieTagi(wRodzaju.map((g) => ({ tagi: g.quizy?.tagi ?? [] })));
  const wybranyTag = typeof tag === "string" && tagi.includes(tag) ? tag : null;
  const gry = wybranyTag ? wRodzaju.filter((g) => g.quizy?.tagi.includes(wybranyTag)) : wRodzaju;
  const wybrane: WybraneFiltry = { miasto, lokal, tag: wybranyTag };
  const adres = (r: RodzajQuizu, f: WybraneFiltry) =>
    `/admin/gry?${new URLSearchParams({
      ...(r === "klasyczny" ? { rodzaj: r } : {}),
      ...(f.miasto ? { miasto: f.miasto } : {}),
      ...(f.lokal ? { lokal: f.lokal } : {}),
      ...(f.tag ? { tag: f.tag } : {}),
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
      <ZakladkiRodzaju rodzaj={rodzaj} adres={(r) => adres(r, { ...wybrane, tag: null })} />
      <FiltryListy
        lokale={lokale ?? []}
        tagi={tagi}
        wybrane={wybrane}
        adres={(f) => adres(rodzaj, f)}
        podpisLokalu="Lokal"
      />
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
