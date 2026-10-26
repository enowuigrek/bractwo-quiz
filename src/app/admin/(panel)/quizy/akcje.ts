"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { lokalRoli, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";
import {
  CZASY_ETAPU,
  LIMITY_ETAPU,
  MAX_PLAN_PYTAN,
  MNOZNIKI,
  SZABLONY_ETAPOW,
  SZABLONY_QUIZU,
  typDomyslny,
} from "@/lib/etapy";
import { czyTypZadania, PRAWDA_FALSZ, type Dodatki, type ZadanieDane } from "@/lib/zadania";
import { czytajPytania } from "@/lib/import-pytan";
import { czytajTagi } from "@/lib/tagi";
import { LIMITY, liczbaPytan } from "./limity";

function tekst(dane: FormData, pole: string): string {
  return String(dane.get(pole) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Quizy
// ---------------------------------------------------------------------------

export async function utworzQuiz(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const rola = await wymagajAdmina();
  const tytul = tekst(dane, "tytul");
  if (!tytul) return { blad: "Podaj tytuł quizu." };
  if (tytul.length > LIMITY.tytul) return { blad: `Tytuł może mieć najwyżej ${LIMITY.tytul} znaków.` };

  // etapy na sztywno z szablonu quizu (src/lib/etapy.ts), kreator ich nie zmienia
  const szablonQuizu = SZABLONY_QUIZU.find((s) => s.klucz === dane.get("szablon"));
  if (!szablonQuizu) return { blad: "Wybierz szablon quizu." };
  const etapy = [];
  for (const [i, e] of szablonQuizu.etapy.entries()) {
    const szablon = SZABLONY_ETAPOW.find((s) => s.klucz === e.szablon);
    if (!szablon) return { blad: "Nieprawidłowe etapy." };
    etapy.push({
      nr: i + 1,
      nazwa: szablon.nazwa,
      opis: szablon.opis,
      mnoznik: szablon.mnoznik,
      czas_s: szablon.czas_s,
      finalowy: szablon.finalowy,
      seria: szablon.seria,
      plan_pytan: e.pytania,
      typ_domyslny: typDomyslny(szablon),
      ikona: szablon.ikona ?? null,
    });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("quizy")
    // quiz lokalu jest jego (`lokal_id`, widzi go też główny); główny decyduje, czy jego quiz widzą lokale
    .insert({
      tytul,
      opis: tekst(dane, "opis") || null,
      tagi: czytajTagi(tekst(dane, "tagi")),
      tylko_glowny: widziWszystko(rola) && !!dane.get("tylko_glowny"),
      lokal_id: lokalRoli(rola),
    })
    .select("id")
    .single();
  if (error) return { blad: `Nie udało się utworzyć quizu: ${error.message}` };
  if (etapy.length) {
    const { error: e } = await db.from("etapy").insert(etapy.map((e) => ({ ...e, quiz_id: data.id })));
    if (e) return { blad: `Quiz utworzony, ale bez etapów: ${e.message}` };
  }
  redirect(`/admin/quizy/${data.id}`);
}

export async function zapiszQuiz(id: string, _: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajQuizu(await wymagajAdmina(), id);
  const tytul = tekst(dane, "tytul");
  const opis = tekst(dane, "opis");
  if (!tytul) return { blad: "Podaj tytuł quizu." };
  if (tytul.length > LIMITY.tytul) return { blad: `Tytuł może mieć najwyżej ${LIMITY.tytul} znaków.` };
  if (opis.length > LIMITY.opis) return { blad: `Opis może mieć najwyżej ${LIMITY.opis} znaków.` };

  const db = supabaseAdmin();
  const { error } = await db
    .from("quizy")
    .update({ tytul, opis: opis || null, tagi: czytajTagi(tekst(dane, "tagi")) })
    .eq("id", id);
  if (error) return { blad: `Nie udało się zapisać: ${error.message}` };
  // „Zapisz quiz” na dole edycji: zapis i powrót do listy, na zakładkę rodzaju tego quizu
  if (dane.get("wroc")) {
    const { count: etapow } = await db.from("etapy").select("id", { count: "exact", head: true }).eq("quiz_id", id);
    redirect(etapow ? "/admin/quizy" : "/admin/quizy?rodzaj=klasyczny");
  }
  refresh();
  return { ok: "Zapisano." };
}

/** Przełącznik „Tylko dla mnie” na stronie quizu: lokale przestają albo zaczynają widzieć quiz Bractwa. */
export async function ustawWidocznoscQuizu(id: string, tylkoGlowny: boolean): Promise<void> {
  const rola = await wymagajAdmina();
  if (!widziWszystko(rola)) return;
  const { error } = await supabaseAdmin().from("quizy").update({ tylko_glowny: tylkoGlowny }).eq("id", id);
  if (error) throw new Error(`Nie udało się zmienić widoczności: ${error.message}`);
  refresh();
}

/**
 * „Usuń” na liście quizów: quiz trafia do kosza (`usunieto`), skąd da się go przywrócić. Na dobre kasuje go dopiero
 * `usunQuizNaZawsze` z kosza (26.10, po przypadkowym usunięciu Piwnego quizu).
 */
export async function usunQuiz(id: string): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), id);
  const db = supabaseAdmin();
  // powrót na zakładkę rodzaju tego quizu (klasyczny = bez etapów)
  const { count: etapow } = await db.from("etapy").select("id", { count: "exact", head: true }).eq("quiz_id", id);
  const lista = etapow ? "/admin/quizy?" : "/admin/quizy?rodzaj=klasyczny&";
  const { error } = await db.from("quizy").update({ usunieto: new Date().toISOString() }).eq("id", id).is("usunieto", null);
  if (error) redirect(`${lista}blad=usuwanie`);
  redirect(`${lista}kosz=1`);
}

/** Przywraca quiz z kosza na listę. */
export async function przywrocQuiz(id: string): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), id);
  const { error } = await supabaseAdmin().from("quizy").update({ usunieto: null }).eq("id", id);
  if (error) throw new Error(`Nie udało się przywrócić quizu: ${error.message}`);
  refresh();
}

/** Kasuje quiz z kosza na dobre, razem z pytaniami, etapami i grafikami z magazynu. Nie da się tego cofnąć. */
export async function usunQuizNaZawsze(id: string): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), id);
  const db = supabaseAdmin();
  const { data: quiz } = await db.from("quizy").select("usunieto").eq("id", id).maybeSingle<{ usunieto: string | null }>();
  // tylko z kosza: quiz z listy najpierw trafia do kosza
  if (!quiz?.usunieto) redirect("/admin/quizy/kosz");
  const { count } = await db.from("sesje").select("id", { count: "exact", head: true }).eq("quiz_id", id);
  if (count) redirect("/admin/quizy/kosz?blad=gry");

  const { data: zadania } = await db.from("zadania").select("grafika_url").eq("quiz_id", id);
  const { error } = await db.from("quizy").delete().eq("id", id).not("usunieto", "is", null);
  if (error) redirect("/admin/quizy/kosz?blad=usuwanie");
  await Promise.all((zadania ?? []).map((z) => usunGrafike(z.grafika_url)));
  refresh();
}

// ---------------------------------------------------------------------------
// Zadania (typy: src/lib/zadania.ts)
// ---------------------------------------------------------------------------

/** Losowa permutacja 0..n-1, różna od ułożenia po kolei (żeby nie dało się odgadnąć „z góry”). */
function mieszanie(n: number): number[] {
  for (;;) {
    const p = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    if (n < 2 || p.some((x, i) => x !== i)) return p;
  }
}

/** Sprawdza listę tekstów: liczba, puste, długość, powtórzenia. Zwraca opis błędu albo null. */
function bladListy(teksty: unknown, min: number, nazwa: string): string | null {
  if (!Array.isArray(teksty) || teksty.some((t) => typeof t !== "string")) return "Nieprawidłowe dane pytania.";
  const lista = (teksty as string[]).map((t) => t.trim());
  if (lista.length < min || lista.length > LIMITY.maxOdpowiedzi) {
    return `Pytanie musi mieć od ${min} do ${LIMITY.maxOdpowiedzi} ${nazwa}.`;
  }
  if (lista.some((t) => !t)) return "Uzupełnij wszystkie pola albo usuń puste.";
  if (lista.some((t) => t.length > LIMITY.odpowiedz)) return `Pole może mieć najwyżej ${LIMITY.odpowiedz} znaków.`;
  if (new Set(lista.map((t) => t.toLocaleLowerCase("pl"))).size !== lista.length)
    return "Wiersze nie mogą się powtarzać.";
  return null;
}

const przytnij = (t: unknown) => String(t).trim();

/** Podpowiedzi (puste pomijamy) i odsłanianie grafiki: wspólne dla wszystkich typów. */
function odczytajDodatki(surowe: Record<string, unknown>): { blad: string } | Dodatki {
  const lista = Array.isArray(surowe.podpowiedzi) ? surowe.podpowiedzi : [];
  if (lista.some((t) => typeof t !== "string")) return { blad: "Nieprawidłowe podpowiedzi." };
  const podpowiedzi = (lista as string[]).map((t) => t.trim()).filter(Boolean);
  if (podpowiedzi.length > LIMITY.maxPodpowiedzi) {
    return { blad: `Pytanie może mieć najwyżej ${LIMITY.maxPodpowiedzi} podpowiedzi.` };
  }
  if (podpowiedzi.some((t) => t.length > LIMITY.odpowiedz)) {
    return { blad: `Podpowiedź może mieć najwyżej ${LIMITY.odpowiedz} znaków.` };
  }
  const dodatki: Dodatki = {};
  if (podpowiedzi.length) dodatki.podpowiedzi = podpowiedzi;
  if (surowe.odslaniaj === true) dodatki.odslaniaj = true;
  return dodatki;
}

function liczbaZPola(x: unknown): number | null {
  const n = typeof x === "number" ? x : typeof x === "string" && x.trim() ? Number(x.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? n : null;
}

function odczytajZadanie(dane: FormData): { blad: string } | ({ tresc: string } & ZadanieDane) {
  const wynik = odczytajTresc(dane);
  if ("blad" in wynik) return wynik;
  let surowe: Record<string, unknown>;
  try {
    surowe = JSON.parse(String(dane.get("dane") ?? "{}"));
  } catch {
    return { blad: "Nieprawidłowe dane pytania." };
  }
  const dodatki = odczytajDodatki(surowe);
  if ("blad" in dodatki) return dodatki;
  return { ...wynik, dane: { ...wynik.dane, ...dodatki } } as { tresc: string } & ZadanieDane;
}

function odczytajTresc(dane: FormData): { blad: string } | ({ tresc: string } & ZadanieDane) {
  const tresc = tekst(dane, "tresc");
  if (!tresc) return { blad: "Wpisz treść pytania." };
  if (tresc.length > LIMITY.tresc) return { blad: `Pytanie może mieć najwyżej ${LIMITY.tresc} znaków.` };

  const typ = dane.get("typ");
  if (!czyTypZadania(typ)) return { blad: "Wybierz rodzaj pytania." };
  let surowe: Record<string, unknown>;
  try {
    surowe = JSON.parse(String(dane.get("dane") ?? "{}"));
  } catch {
    return { blad: "Nieprawidłowe dane pytania." };
  }

  // ciekawostka: sam tekst pod tytułem (grafika jak w każdym pytaniu), bez odpowiedzi
  if (typ === "ciekawostka") {
    const opis = typeof surowe.tekst === "string" ? surowe.tekst.trim().replace(/\s+/g, " ") : "";
    if (!opis) return { blad: "Wpisz tekst ciekawostki." };
    if (opis.length > 400) return { blad: "Tekst ciekawostki może mieć najwyżej 400 znaków." };
    return { tresc, typ, dane: { tekst: opis } };
  }

  // czas na odpowiedź ustawia się przy uruchamianiu gry albo w etapie, nie w pytaniu
  if (typ === "prawda_falsz") {
    if (surowe.poprawna !== 0 && surowe.poprawna !== 1) return { blad: "Zaznacz, czy zdanie jest prawdą czy fałszem." };
    return { tresc, typ, dane: { odpowiedzi: PRAWDA_FALSZ, poprawna: surowe.poprawna } };
  }

  if (typ === "szacowanie") {
    const [min, max, krok, poprawna] = [surowe.min, surowe.max, surowe.krok, surowe.poprawna].map(liczbaZPola);
    if (min === null || max === null || min >= max)
      return { blad: "Podaj zakres: najmniejsza liczba mniejsza od największej." };
    if (krok === null || krok <= 0) return { blad: "Krok musi być większy od zera (np. 1 albo 0,1)." };
    if ((max - min) / krok > 100_000)
      return { blad: "Za duży zakres przy takim kroku. Zwiększ krok albo zmniejsz zakres." };
    if (poprawna === null || poprawna < min || poprawna > max) return { blad: "Poprawna liczba musi być w zakresie." };
    const tolerancja = liczbaZPola(surowe.tolerancja) ?? (max - min) / 4;
    if (tolerancja <= 0) return { blad: "Odległość do zera punktów musi być większa od zera." };
    const jednostka = typeof surowe.jednostka === "string" ? surowe.jednostka.trim().slice(0, 12) || null : null;
    return { tresc, typ, dane: { min, max, krok, tolerancja, jednostka, poprawna } };
  }

  if (typ === "wybor" || typ === "wielokrotny") {
    const blad = bladListy(surowe.odpowiedzi, LIMITY.minOdpowiedzi, "odpowiedzi");
    if (blad) return { blad };
    const odpowiedzi = (surowe.odpowiedzi as string[]).map(przytnij);
    const wRamach = (i: unknown) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < odpowiedzi.length;
    if (typ === "wybor") {
      if (!wRamach(surowe.poprawna)) return { blad: "Zaznacz poprawną odpowiedź." };
      return { tresc, typ, dane: { odpowiedzi, poprawna: surowe.poprawna as number } };
    }
    const poprawna = [...new Set(Array.isArray(surowe.poprawna) ? surowe.poprawna : [])];
    if (poprawna.length === 0 || !poprawna.every(wRamach))
      return { blad: "Zaznacz co najmniej jedną poprawną odpowiedź." };
    return { tresc, typ, dane: { odpowiedzi, poprawna: (poprawna as number[]).sort((a, b) => a - b) } };
  }

  if (typ === "kolejnosc") {
    const blad = bladListy(surowe.elementy, 3, "elementów");
    if (blad) return { blad };
    // edytor podaje elementy we właściwej kolejności; graczom pokazujemy je pomieszane
    const wlasciwa = (surowe.elementy as string[]).map(przytnij);
    const pokaz = mieszanie(wlasciwa.length);
    const elementy = pokaz.map((i) => wlasciwa[i]);
    const poprawna = wlasciwa.map((_, k) => pokaz.indexOf(k));
    return { tresc, typ, dane: { elementy, poprawna } };
  }

  // pary: [[lewy, prawy], …]; prawą stronę mieszamy
  const pary = Array.isArray(surowe.pary) ? (surowe.pary as unknown[]) : [];
  if (!pary.every((p) => Array.isArray(p) && p.length === 2)) return { blad: "Nieprawidłowe dane pytania." };
  const lewe = pary.map((p) => przytnij((p as unknown[])[0]));
  const praweWlasciwe = pary.map((p) => przytnij((p as unknown[])[1]));
  const blad = bladListy(lewe, 2, "par") ?? bladListy(praweWlasciwe, 2, "par");
  if (blad) return { blad };
  const pokaz = mieszanie(praweWlasciwe.length);
  const prawe = pokaz.map((i) => praweWlasciwe[i]);
  const poprawna = praweWlasciwe.map((_, k) => pokaz.indexOf(k));
  return { tresc, typ, dane: { lewe, prawe, poprawna } };
}

/** Dodaje zadanie na koniec quizu (zadanieId = null) albo zapisuje zmiany. */
export async function zapiszZadanie(
  quizId: string,
  zadanieId: string | null,
  _: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const db = supabaseAdmin();

  const odczyt = odczytajZadanie(dane);
  if ("blad" in odczyt) return odczyt;

  // klasyczny quiz (bez etapów) nie ma nowych ciekawostek
  if (odczyt.typ === "ciekawostka" && !zadanieId) {
    const { count } = await db.from("etapy").select("id", { count: "exact", head: true }).eq("quiz_id", quizId);
    if (!count) return { blad: "W klasycznym quizie nie ma ciekawostek." };
  }

  // etap z listy etapów tego quizu (pusty: quiz bez etapów)
  const etapId = tekst(dane, "etap_id") || null;
  if (etapId) {
    const { data: etap } = await db.from("etapy").select("id").eq("id", etapId).eq("quiz_id", quizId).maybeSingle();
    if (!etap) return { blad: "Wybierz etap z listy." };
  }

  const grafika = plikZFormularza(dane, "grafika");
  if (grafika) {
    const blad = bladGrafiki(grafika);
    if (blad) return { blad };
  }

  let staraGrafika: string | null = null;
  if (zadanieId) {
    const { data, error } = await db
      .from("zadania")
      .select("grafika_url")
      .eq("id", zadanieId)
      .eq("quiz_id", quizId)
      .single();
    if (error) return { blad: "Nie ma takiego zadania." };
    staraGrafika = data.grafika_url;
  }

  const zmiany: Record<string, unknown> = { ...odczyt, etap_id: etapId };
  try {
    if (grafika) zmiany.grafika_url = await wyslijGrafike(grafika, "zadania");
    else if (dane.get("grafika_usun")) zmiany.grafika_url = null;
  } catch (e) {
    return { blad: (e as Error).message };
  }

  let error;
  if (zadanieId) {
    ({ error } = await db.from("zadania").update(zmiany).eq("id", zadanieId));
  } else {
    const { data: ostatnie } = await db
      .from("zadania")
      .select("nr")
      .eq("quiz_id", quizId)
      .order("nr", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await db.from("zadania").insert({ ...zmiany, quiz_id: quizId, nr: (ostatnie?.nr ?? 0) + 1 }));
  }
  if (error) {
    if (typeof zmiany.grafika_url === "string") await usunGrafike(zmiany.grafika_url);
    return { blad: `Nie udało się zapisać: ${error.message}` };
  }
  if ("grafika_url" in zmiany && staraGrafika) await usunGrafike(staraGrafika);
  // pytanie trafia na swoje miejsce w etapie (nowe na koniec etapu)
  await uporzadkuj(quizId);

  // „Zapisz i dodaj następne”: od razu kolejne pytanie w tym samym etapie
  if (dane.get("dalej")) redirect(`/admin/quizy/${quizId}/zadania/nowe${etapId ? `?etap=${etapId}` : ""}`);
  redirect(`/admin/quizy/${quizId}`);
}

/** Najwięcej pytań wklejonych naraz (cały quiz z AI to zwykle 20–40). */
const MAX_WKLEJONYCH = 80;

/**
 * Wklejone pytania (klasyczny quiz, `src/lib/import-pytan.ts`): każde przechodzi tę samą walidację co formularz
 * pytania i trafia na koniec quizu. Zapis wszystkich albo żadnego: przy jednym błędzie nic nie dodajemy.
 */
export async function wklejPytania(quizId: string, _: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const db = supabaseAdmin();
  const { count: etapow } = await db.from("etapy").select("id", { count: "exact", head: true }).eq("quiz_id", quizId);
  if (etapow) return { blad: "Wklejanie jest w klasycznym quizie (bez etapów)." };

  const { pytania, bledy } = czytajPytania(String(dane.get("tekst") ?? ""));
  if (bledy.length) return { blad: bledy.join(" ") };
  if (!pytania.length) return { blad: "Wklej pytania w formacie z instrukcji pod polem." };
  if (pytania.length > MAX_WKLEJONYCH) return { blad: `Naraz najwyżej ${MAX_WKLEJONYCH} pytań.` };

  const wiersze = [];
  for (const [i, p] of pytania.entries()) {
    const pola = new FormData();
    pola.set("tresc", p.tresc);
    pola.set("typ", p.typ);
    pola.set("dane", JSON.stringify(p.dane));
    const odczyt = odczytajZadanie(pola);
    if ("blad" in odczyt) return { blad: `Pytanie ${i + 1} („${p.tresc.slice(0, 40)}”): ${odczyt.blad}` };
    wiersze.push(odczyt);
  }

  const { data: ostatnie } = await db
    .from("zadania")
    .select("nr")
    .eq("quiz_id", quizId)
    .order("nr", { ascending: false })
    .limit(1)
    .maybeSingle();
  const od = (ostatnie?.nr ?? 0) + 1;
  const { error } = await db
    .from("zadania")
    .insert(wiersze.map((w, i) => ({ ...w, quiz_id: quizId, etap_id: null, nr: od + i })));
  if (error) return { blad: `Nie udało się zapisać: ${error.message}` };
  refresh();
  return { ok: `Dodano ${liczbaPytan(wiersze.length)}. Przejrzyj je na liście i dodaj grafiki.` };
}

export async function usunZadanie(quizId: string, zadanieId: string): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const { data } = await supabaseAdmin()
    .from("zadania")
    .delete()
    .eq("id", zadanieId)
    .eq("quiz_id", quizId)
    .select("grafika_url")
    .maybeSingle();
  await usunGrafike(data?.grafika_url);
  redirect(`/admin/quizy/${quizId}`);
}

/** Numeruje etapy 1..n i ustawia pytania etapami (`admin_uporzadkuj_quiz`). */
async function uporzadkuj(quizId: string): Promise<void> {
  const { error } = await supabaseAdmin().rpc("admin_uporzadkuj_quiz", { p_quiz: quizId });
  if (error) throw new Error(`Nie udało się uporządkować pytań: ${error.message}`);
}

/**
 * Zamienia zadanie z sąsiadem wyżej albo niżej. Na granicy etapu pytanie przechodzi do sąsiedniego
 * etapu (na jego koniec albo początek) zamiast zamieniać się z pytaniem z innego etapu.
 */
export async function przesunZadanie(quizId: string, zadanieId: string, kierunek: "gora" | "dol"): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const db = supabaseAdmin();
  const { data: zadania } = await db.from("zadania").select("id, etap_id").eq("quiz_id", quizId).order("nr");
  const lista = zadania ?? [];
  const i = lista.findIndex((z) => z.id === zadanieId);
  const j = kierunek === "gora" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return;

  if (lista[i].etap_id !== lista[j].etap_id) {
    const { error } = await db.from("zadania").update({ etap_id: lista[j].etap_id }).eq("id", zadanieId);
    if (error) throw new Error(`Nie udało się przenieść pytania: ${error.message}`);
    await uporzadkuj(quizId);
  } else {
    const { error } = await db.rpc("admin_zamien_zadania", { p_a: lista[i].id, p_b: lista[j].id });
    if (error) throw new Error(`Nie udało się zmienić kolejności: ${error.message}`);
  }
  refresh();
}

// ---------------------------------------------------------------------------
// Etapy (src/lib/etapy.ts)
// ---------------------------------------------------------------------------

type PolaEtapu = {
  nazwa: string;
  opis: string | null;
  mnoznik: number;
  czas_s: number | null;
  finalowy: boolean;
  seria: boolean;
  plan_pytan: number | null;
  typ_domyslny: string | null;
};

function odczytajEtap(dane: FormData): { blad: string } | PolaEtapu {
  const nazwa = tekst(dane, "nazwa");
  const opis = tekst(dane, "opis");
  if (!nazwa) return { blad: "Podaj nazwę etapu." };
  if (nazwa.length > LIMITY_ETAPU.nazwa) return { blad: `Nazwa może mieć najwyżej ${LIMITY_ETAPU.nazwa} znaków.` };
  if (opis.length > LIMITY_ETAPU.opis) return { blad: `Zasady mogą mieć najwyżej ${LIMITY_ETAPU.opis} znaków.` };
  const mnoznik = Number(tekst(dane, "mnoznik") || 1);
  if (!(MNOZNIKI as readonly number[]).includes(mnoznik)) return { blad: "Wybierz mnożnik punktów z listy." };
  const czasTekst = tekst(dane, "czas_s");
  const czas_s = czasTekst ? Number(czasTekst) : null;
  if (!CZASY_ETAPU.includes(czas_s)) return { blad: "Wybierz czas z listy." };
  const planTekst = tekst(dane, "plan_pytan");
  const plan_pytan = planTekst ? Number(planTekst) : null;
  if (plan_pytan !== null && (!Number.isInteger(plan_pytan) || plan_pytan < 1 || plan_pytan > MAX_PLAN_PYTAN)) {
    return { blad: `Liczba pytań w etapie: od 1 do ${MAX_PLAN_PYTAN} (albo puste).` };
  }
  const typ = dane.get("typ_domyslny");
  return {
    nazwa,
    opis: opis || null,
    mnoznik,
    czas_s,
    finalowy: dane.get("finalowy") === "1",
    seria: dane.get("seria") === "1",
    plan_pytan,
    typ_domyslny: czyTypZadania(typ) ? typ : null,
  };
}

/** −/+ przy etapie: zmienia planowaną liczbę pytań (bez planu: zaczyna od liczby obecnych pytań). */
export async function zmienPlanEtapu(quizId: string, etapId: string, o: 1 | -1): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const db = supabaseAdmin();
  const { data: etap } = await db.from("etapy").select("plan_pytan").eq("id", etapId).eq("quiz_id", quizId).single();
  if (!etap) return;
  const { count } = await db.from("zadania").select("id", { count: "exact", head: true }).eq("etap_id", etapId);
  const teraz = etap.plan_pytan ?? Math.max(1, count ?? 0);
  const nowy = Math.min(MAX_PLAN_PYTAN, Math.max(1, teraz + o));
  const { error } = await db.from("etapy").update({ plan_pytan: nowy }).eq("id", etapId);
  if (error) throw new Error(`Nie udało się zmienić liczby pytań: ${error.message}`);
  refresh();
}

/** Nowy etap na końcu quizu. Pierwszy etap dostaje wszystkie dotychczasowe pytania. */
export async function dodajEtap(quizId: string, _: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const db = supabaseAdmin();
  const etap = odczytajEtap(dane);
  if ("blad" in etap) return etap;

  const { data: ostatni } = await db
    .from("etapy")
    .select("nr")
    .eq("quiz_id", quizId)
    .order("nr", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: nowy, error } = await db
    .from("etapy")
    .insert({ ...etap, quiz_id: quizId, nr: (ostatni?.nr ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return { blad: `Nie udało się dodać etapu: ${error.message}` };

  if (!ostatni) {
    const { error: e } = await db
      .from("zadania")
      .update({ etap_id: nowy.id })
      .eq("quiz_id", quizId)
      .is("etap_id", null);
    if (e) return { blad: `Etap dodany, ale nie udało się przypisać pytań: ${e.message}` };
  }
  await uporzadkuj(quizId);
  refresh();
  return { ok: "Dodano etap." };
}

export async function zapiszEtap(
  quizId: string,
  etapId: string,
  _: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const etap = odczytajEtap(dane);
  if ("blad" in etap) return etap;
  const { error } = await supabaseAdmin().from("etapy").update(etap).eq("id", etapId).eq("quiz_id", quizId);
  if (error) return { blad: `Nie udało się zapisać etapu: ${error.message}` };
  refresh();
  return { ok: "Zapisano." };
}

/** Usuwa etap; jego pytania przechodzą do poprzedniego etapu (albo następnego, gdy to pierwszy). */
export async function usunEtap(quizId: string, etapId: string): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const db = supabaseAdmin();
  const { data: etapy } = await db.from("etapy").select("id").eq("quiz_id", quizId).order("nr");
  const lista = etapy ?? [];
  const i = lista.findIndex((e) => e.id === etapId);
  if (i < 0) return;
  const sasiad = lista[i - 1] ?? lista[i + 1] ?? null;
  const { error: e1 } = await db
    .from("zadania")
    .update({ etap_id: sasiad?.id ?? null })
    .eq("etap_id", etapId);
  if (e1) throw new Error(`Nie udało się przenieść pytań: ${e1.message}`);
  const { error } = await db.from("etapy").delete().eq("id", etapId).eq("quiz_id", quizId);
  if (error) throw new Error(`Nie udało się usunąć etapu: ${error.message}`);
  await uporzadkuj(quizId);
  refresh();
}

/** Zamienia etap z sąsiednim (razem z pytaniami). */
export async function przesunEtap(quizId: string, etapId: string, kierunek: "gora" | "dol"): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), quizId);
  const db = supabaseAdmin();
  const { data: etapy } = await db.from("etapy").select("id, nr").eq("quiz_id", quizId).order("nr");
  const lista = etapy ?? [];
  const i = lista.findIndex((e) => e.id === etapId);
  const j = kierunek === "gora" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return;
  // numery są unikalne z odroczonym sprawdzaniem, ale każde update to osobna transakcja: najpierw poza zakres
  const { error: e1 } = await db
    .from("etapy")
    .update({ nr: 10_000 + lista[i].nr })
    .eq("id", lista[i].id);
  const { error: e2 } = await db.from("etapy").update({ nr: lista[i].nr }).eq("id", lista[j].id);
  const { error: e3 } = await db.from("etapy").update({ nr: lista[j].nr }).eq("id", lista[i].id);
  const blad = e1 ?? e2 ?? e3;
  if (blad) throw new Error(`Nie udało się zmienić kolejności etapów: ${blad.message}`);
  await uporzadkuj(quizId);
  refresh();
}
