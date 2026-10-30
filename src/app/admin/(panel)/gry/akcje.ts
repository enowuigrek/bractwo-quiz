"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { lokalRoli, ukryteLokale, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { wymagajGry, wymagajQuizu } from "@/lib/admin-dostep";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { kontoInstagram } from "@/lib/instagram";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Nagroda, StanFormularza } from "@/lib/typy";
import { MAX_GRACZY } from "@/lib/gra/wyscig";
import { LIMITY } from "../quizy/limity";

const MAX_OKAZJA = 80;
const MAX_NOTATKA = 5000;

export async function uruchomGre(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();

  const lokal_id = String(dane.get("lokal_id") ?? "");
  const quiz_id = String(dane.get("quiz_id") ?? "");
  const okazja = String(dane.get("okazja") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  // kreator nie pokazuje już drużyn (każdy gra sam); tryb zostaje w bazie dla starszych gier
  const tryb = dane.get("tryb") === "druzyny" ? "druzyny" : "solo";
  // czas na odpowiedź dla wszystkich pytań; bonus za szybkość jest zawsze (bez limitu maleje przez 30–60 s),
  // a limit tylko odlicza czas, po którym nie da się już odpowiedzieć
  const czasPole = String(dane.get("czas_s") ?? "");
  const czas_s = czasPole === "bez" ? null : Number(czasPole);
  const bonus_czas = true;
  // na razie najwyżej 20 graczy (MAX_GRACZY: tyle mieści ranking na TV na dwóch stronach)
  const max_graczy = Number(dane.get("max_graczy") || MAX_GRACZY);

  if (!lokal_id) return { blad: "Wybierz lokal." };
  if (!quiz_id) return { blad: "Wybierz quiz." };
  // lokal gra tylko u siebie, a quizy Bractwa może uruchamiać (bez zmieniania ich)
  if (lokalRoli(rola) && lokalRoli(rola) !== lokal_id) return { blad: "Możesz uruchomić grę tylko w swoim lokalu." };
  if (ukryteLokale(rola).includes(lokal_id)) return { blad: "Wybierz lokal." };
  await wymagajQuizu(rola, quiz_id, true);
  if (czas_s !== null && (!Number.isInteger(czas_s) || czas_s < LIMITY.minCzas || czas_s > LIMITY.maxCzas)) {
    return { blad: "Wybierz czas na odpowiedź." };
  }
  if (okazja.length > MAX_OKAZJA) return { blad: `Okazja może mieć najwyżej ${MAX_OKAZJA} znaków.` };
  if (!Number.isInteger(max_graczy) || max_graczy < 1 || max_graczy > MAX_GRACZY) {
    return { blad: `Limit graczy musi być liczbą od 1 do ${MAX_GRACZY}.` };
  }

  // nagrody: tylko 1. miejsce albo pierwsza trójka, każde miejsce z własną instrukcją odbioru
  const ileNagrod = dane.get("nagrody") === "3" ? 3 : dane.get("nagrody") === "1" ? 1 : 0;
  const nagrody: Nagroda[] = [];
  for (let m = 1; m <= ileNagrod; m++) {
    const nagroda = String(dane.get(`nagroda_${m}`) ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const instrukcja = String(dane.get(`instrukcja_${m}`) ?? "")
      .trim()
      .replace(/\s+/g, " ");
    if (!nagroda) return { blad: `Wpisz nagrodę za ${m}. miejsce.` };
    if (nagroda.length > LIMITY.nagroda || instrukcja.length > LIMITY.instrukcja) {
      return { blad: `Nagroda za ${m}. miejsce jest za długa.` };
    }
    // zdjęcie tylko z naszego bucketu (wysłane przez /api/nagroda)
    const zdjecie = String(dane.get(`nagroda_zdjecie_${m}`) ?? "");
    const naszeZdjecie = zdjecie.startsWith(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/grafiki/nagrody/`,
    );
    nagrody.push({
      miejsce: m as Nagroda["miejsce"],
      nagroda,
      instrukcja: instrukcja || null,
      ...(naszeZdjecie ? { zdjecie } : {}),
    });
  }

  const [{ data: lokal }, { count: pytania }, { data: quiz }, { count: finalySerii }, { count: etapow }] =
    await Promise.all([
    db.from("lokale").select("id").eq("id", lokal_id).maybeSingle(),
    db.from("zadania").select("id", { count: "exact", head: true }).eq("quiz_id", quiz_id),
    db
      .from("quizy")
      .select("udostepniony, usunieto")
      .eq("id", quiz_id)
      .maybeSingle<{ udostepniony: boolean; usunieto: string | null }>(),
    db
      .from("etapy")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quiz_id)
      .eq("finalowy", true)
      .eq("seria", true),
    db.from("etapy").select("id", { count: "exact", head: true }).eq("quiz_id", quiz_id),
  ]);
  // klasyczny pub quiz (bez etapów): bez kranoprzejęcia i grafiki na poczekalnię (kreator ich nie pokazuje)
  const klasyczny = !etapow;
  if (!lokal) return { blad: "Nie ma takiego lokalu." };
  // jeden lokal = jeden ekran, więc najwyżej jedna niezakończona gra (w bazie pilnuje tego `sesje_jedna_w_lokalu`)
  const { data: trwajaca } = await db
    .from("sesje")
    .select("kod")
    .eq("lokal_id", lokal_id)
    .neq("faza", "koniec")
    .limit(1)
    .maybeSingle<{ kod: string }>();
  if (trwajaca) return { blad: `W tym lokalu jest już gra ${trwajaca.kod}. Zakończ ją w pilocie, zanim uruchomisz nową.` };
  if (!pytania) return { blad: "Ten quiz nie ma jeszcze pytań." };
  if (quiz?.usunieto) return { blad: "Ten quiz jest w koszu. Przywróć go w Quizy → Kosz." };

  // zapowiedź: godzina startu (ISO z przeglądarki), poczekalnia zamknięta do otwarcia na pilocie
  const zapowiedz = dane.get("start_tryb") === "zapowiedz";
  const startPole = String(dane.get("planowany_start") ?? "");
  const planowany_start = startPole && !Number.isNaN(Date.parse(startPole)) ? new Date(startPole).toISOString() : null;
  if (zapowiedz && !planowany_start) return { blad: "Do zapowiedzi ustaw godzinę startu." };
  // automat (src/lib/gra/auto.ts): z godziną sam otwiera poczekalnię i 5 minut później startuje quiz;
  // pilot może go wyłączyć i włączyć w trakcie gry
  const auto = dane.get("auto") === "on";

  // „Pijany finał”: dogrywka bez punktów po finale serią; imię osoby za barem do jednego z pytań.
  // tylko w wyścigu po piwo (quiz z finałem serią); klasyczny pub quiz nie ma finału
  // (od 26.10 włącza go też lokal; pytania zmienia tylko główny)
  const pijany_final = !!finalySerii && dane.get("pijany_final") === "on";
  // gra głównego jest domyślnie tylko jego (lokal jej nie widzi; przełącznik w kreatorze); gra z ukrytego quizu zawsze
  const tylko_glowny = widziWszystko(rola) && (dane.get("tylko_glowny") === "on" || !quiz?.udostepniony);
  const za_barem = pijany_final
    ? String(dane.get("za_barem") ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 40) || null
    : null;

  // gościnny browar (kranoprzejęcie): nazwa wymagana, gdy jest logo
  const browar_nazwa = klasyczny
    ? null
    : String(dane.get("browar_nazwa") ?? "")
      .trim()
      .replace(/\s+/g, " ") || null;
  const browarLogo = klasyczny ? null : plikZFormularza(dane, "browar_logo");
  if (browarLogo && !browar_nazwa) return { blad: "Podaj nazwę browaru do logo." };
  if (browar_nazwa && browar_nazwa.length > 80) return { blad: "Nazwa browaru może mieć najwyżej 80 znaków." };
  const browar_instagram = kontoInstagram(dane.get("browar_instagram"));
  if (browar_instagram === false) return { blad: "Instagram browaru: sama nazwa konta, np. @browar." };

  // grafiki na poczekalnię już nie ma (26.10, Łukasz: przy wspólnym tle wyglądała źle); `grafika_url` zostaje
  // w bazie dla starszych gier
  const bladLogo = browarLogo && bladGrafiki(browarLogo);
  if (bladLogo) return { blad: bladLogo };
  let browar_logo_url: string | null = null;
  try {
    if (browarLogo) browar_logo_url = await wyslijGrafike(browarLogo, "sesje");
  } catch (e) {
    return { blad: (e as Error).message };
  }

  const { data, error } = await db
    .from("sesje")
    .insert({
      lokal_id,
      quiz_id,
      okazja: okazja || null,
      tryb,
      czas_s,
      bonus_czas,
      max_graczy,
      nagrody: nagrody.length ? nagrody : null,
      browar_nazwa,
      browar_logo_url,
      browar_instagram: browar_nazwa ? browar_instagram : null,
      planowany_start,
      poczekalnia_otwarta: !zapowiedz,
      auto,
      pijany_final,
      za_barem,
      tylko_glowny,
      autor_konto_id: rola.konto.id,
    })
    .select("kod, host_token")
    .single<{ kod: string; host_token: string }>();
  if (error) {
    await usunGrafike(browar_logo_url);
    // dwa kliknięcia naraz: drugie zatrzymuje indeks `sesje_jedna_w_lokalu`
    if (error.code === "23505") return { blad: "W tym lokalu jest już gra. Zakończ ją w pilocie, zanim uruchomisz nową." };
    return { blad: `Nie udało się uruchomić gry: ${error.message}` };
  }
  // od razu pilot (26.10, Łukasz: na stronie gry i tak zawsze klikał „Prowadź”); rzeczy ze strony gry są na dole
  // pilota, a sama strona gry dalej jest w Rozgrywkach
  redirect(`/pilot/${data.kod}?t=${data.host_token}`);
}

export async function zakonczGre(id: string): Promise<void> {
  await wymagajGry(await wymagajAdmina(), id);
  const { error } = await supabaseAdmin()
    .from("sesje")
    .update({ faza: "koniec", faza_od: new Date().toISOString(), faza_do: null })
    .eq("id", id)
    .neq("faza", "koniec");
  if (error) throw new Error(`Nie udało się zakończyć gry: ${error.message}`);
  refresh();
}

/**
 * Lokal zwalnia ekran zajęty przez grę Bractwa (`tylko_glowny`) w swoim lokalu, ale tylko przed startem (zapowiedź
 * albo poczekalnia; w trakcie ktoś może grać). Gra się kończy, ekran wraca do lokalu, a główny dostaje
 * powiadomienie w panelu (28.10).
 */
export async function zwolnijEkran(id: string): Promise<void> {
  const rola = await wymagajAdmina();
  const lokal = lokalRoli(rola);
  if (!lokal) throw new Error("Ekran zwalnia lokal.");
  const db = supabaseAdmin();
  const { data: gra } = await db
    .from("sesje")
    .select("kod, faza, tylko_glowny, lokal_id, planowany_start, quizy(tytul), lokale(nazwa)")
    .eq("id", id)
    .maybeSingle<{
      kod: string;
      faza: string;
      tylko_glowny: boolean;
      lokal_id: string | null;
      planowany_start: string | null;
      quizy: { tytul: string } | null;
      lokale: { nazwa: string } | null;
    }>();
  if (!gra || gra.lokal_id !== lokal || !gra.tylko_glowny) throw new Error("Nie ma takiej gry w Twoim lokalu.");
  if (gra.faza !== "poczekalnia") throw new Error("Gra już trwa: ekran zwolni się po jej końcu.");
  const { data: zakonczona, error } = await db
    .from("sesje")
    .update({ faza: "koniec", faza_od: new Date().toISOString(), faza_do: null })
    .eq("id", id)
    .eq("faza", "poczekalnia")
    .select("id");
  if (error) throw new Error(`Nie udało się zwolnić ekranu: ${error.message}`);
  if (zakonczona?.length) {
    const start = gra.planowany_start
      ? new Intl.DateTimeFormat("pl-PL", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Warsaw",
        }).format(new Date(gra.planowany_start))
      : null;
    await db.from("powiadomienia").insert({
      tresc: `${gra.lokale?.nazwa ?? "Lokal"} zwolnił ekran: zakończył grę ${gra.kod} (${gra.quizy?.tytul ?? "quiz"}${
        start ? `, start ${start}` : ""
      }) przed startem.`,
    });
  }
  refresh();
}

/**
 * Odbiór nagrody ustawiony w panelu, gdy z telefonu się nie udało (albo cofnięcie pomyłki).
 * Telefon gracza pokaże „Odebrana” przy najbliższym odświeżeniu stanu (co kilka sekund).
 */
export async function ustawOdbiorNagrody(sesjaId: string, graczId: string, odebrana: boolean): Promise<void> {
  await wymagajGry(await wymagajAdmina(), sesjaId);
  const { error } = await supabaseAdmin()
    .from("gracze")
    .update({ nagroda_odebrana: odebrana ? new Date().toISOString() : null })
    .eq("id", graczId)
    .eq("sesja_id", sesjaId);
  if (error) throw new Error(`Nie udało się zapisać odbioru: ${error.message}`);
  refresh();
}

/** Notatki prowadzącego do gry (29.10): co zadziałało, co poprawić, kto grał. */
export async function zapiszNotatke(sesjaId: string, _: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const rola = await wymagajAdmina();
  await wymagajGry(rola, sesjaId);
  const notatka = String(dane.get("notatka") ?? "").trim();
  if (notatka.length > MAX_NOTATKA) return { blad: `Notatki mogą mieć najwyżej ${MAX_NOTATKA} znaków.` };
  // autor przy notatce: logo lokalu, który ją zapisał, albo Bractwa (główny)
  const { error } = await supabaseAdmin()
    .from("sesje")
    .update({
      notatka: notatka || null,
      notatka_lokal_id: notatka ? (lokalRoli(rola) ?? null) : null,
      notatka_konto_id: notatka ? rola.konto.id : null,
      notatka_zmieniono: notatka ? new Date().toISOString() : null,
    })
    .eq("id", sesjaId);
  if (error) return { blad: `Nie udało się zapisać notatek: ${error.message}` };
  refresh();
  return { ok: "Zapisano." };
}

/**
 * Usuwa grę (trwającą albo zakończoną) razem z graczami i odpowiedziami.
 * `przekieruj`: ze strony gry wracamy do listy, z listy tylko ją odświeżamy.
 */
export async function usunGre(id: string, przekieruj: boolean): Promise<void> {
  await wymagajGry(await wymagajAdmina(), id);
  // selfie graczy są w magazynie: kasujemy je razem z grą (wiersze graczy znikają kaskadowo)
  const { data: zdjecia } = await supabaseAdmin()
    .from("gracze")
    .select("zdjecie_url")
    .eq("sesja_id", id)
    .not("zdjecie_url", "is", null);
  const { data, error } = await supabaseAdmin()
    .from("sesje")
    .delete()
    .eq("id", id)
    .select("grafika_url, browar_logo_url")
    .maybeSingle();
  if (error) throw new Error(`Nie udało się usunąć gry: ${error.message}`);
  await Promise.all([
    usunGrafike(data?.grafika_url),
    usunGrafike(data?.browar_logo_url),
    ...(zdjecia ?? []).map((g) => usunGrafike(g.zdjecie_url)),
  ]);
  if (przekieruj) redirect("/admin/gry");
  refresh();
}
