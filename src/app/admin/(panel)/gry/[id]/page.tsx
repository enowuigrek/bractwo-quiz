import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { poprawnyKod } from "@/lib/gra/kod";
import QRCode from "qrcode";
import { adresAplikacji } from "@/lib/adres";
import { wymagajAdmina } from "@/lib/admin";
import { wymagajGry } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { NAZWY_FAZ, type Sesja } from "@/lib/typy";
import { IkonaKosz } from "@/components/ikony";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { ustawOdbiorNagrody, usunGre, zakonczGre } from "../akcje";
import { usunieciGry, wynikiGry, zadaniaGry, type OdpowiedzGracza } from "../wyniki";
import { miejsceZWyscigu } from "@/lib/gra/final";
import { GrafikaPodium } from "./grafika-podium";
import { LinkDoSkopiowania } from "./kopiuj";
import { Notatki, type AutorNotatki } from "./notatki";
import { PrzegladPytan, type GraczPrzegladu } from "./przeglad-pytan";
import { TabelaWynikow } from "./tabela-wynikow";

export const metadata: Metadata = { title: "Gra · Bractwo Quiz" };

type GraZDanymi = Sesja & {
  quizy: { tytul: string; etapy: { count: number }[] } | null;
  lokale: {
    nazwa: string;
    miasto: string | null;
    adres_ekranu: string;
    logo_url: string | null;
    instagram: string | null;
  } | null;
  /** kto uruchomił grę (konta osobowe, 30.10; starsze gry bez autora) */
  konta: { nazwa: string } | null;
};

export default async function Gra({ params, searchParams }: PageProps<"/admin/gry/[id]">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  const widokPytan = (await searchParams).widok === "pytania";
  // z pilota (udostepnij.tsx) przychodzi kod gry zamiast id: najnowsza gra z tym kodem
  if (poprawnyKod(id)) {
    const { data: zKodem } = await supabaseAdmin()
      .from("sesje")
      .select("id")
      .eq("kod", id.toUpperCase())
      .order("utworzono", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();
    if (!zKodem) notFound();
    redirect(`/admin/gry/${zKodem.id}`);
  }
  // lokal ogląda też zakończone gry Bractwa u siebie (`gosc`: bez usuwania i oznaczania nagród)
  const { gosc } = await wymagajGry(rola, id, true);
  const db = supabaseAdmin();

  const [{ data: gra }, { count: gracze }] = await Promise.all([
    db.from("sesje").select("*, quizy(tytul, etapy(count)), lokale(nazwa, miasto, adres_ekranu, logo_url, instagram), konta(nazwa)").eq("id", id).maybeSingle<GraZDanymi>(),
    db.from("gracze").select("id", { count: "exact", head: true }).eq("sesja_id", id),
  ]);
  if (!gra) notFound();

  const adres = await adresAplikacji();
  const linki = {
    ekran: `${adres}/ekran/${gra.kod}`,
    ekranLokalu: gra.lokale ? `${adres}/ekran/${gra.lokale.adres_ekranu}` : null,
    gracz: `${adres}/${gra.kod}`,
    pilot: `${adres}/pilot/${gra.kod}?t=${gra.host_token}`,
  };
  const trwa = gra.faza !== "koniec";
  // ekran lokalu pokazuje najnowszą trwającą grę, więc ostrzegamy o innych w tym samym lokalu
  const { data: inneGry } = trwa && gra.lokal_id
    ? await db.from("sesje").select("kod").eq("lokal_id", gra.lokal_id).neq("faza", "koniec").neq("id", gra.id)
    : { data: [] as { kod: string }[] };
  // historia zakończonej gry: tabela końcowa, a z niej odpowiedzi każdego gracza
  const zadania = trwa ? [] : await zadaniaGry(db, gra.quiz_id, gra.zadanie_nr);
  // pytania z puli finału liczą się każdemu osobno (dostał tyle, na ile zdążył), ciekawostki wcale (28.10)
  const zadaniaSerii = new Set(zadania.filter((z) => z.zSerii).map((z) => z.id));
  const pytanEtapow = zadania.filter((z) => !z.zSerii && z.typ !== "ciekawostka").length;
  const [wyniki, usunieci] = trwa
    ? [[], []]
    : await Promise.all([wynikiGry(db, gra.id, { kod: gra.kod, zadaniaSerii }), usunieciGry(db, gra.id)]);
  // numer pytania w grze (jak na TV, bez ciekawostek) z numeru zadania
  const pytaniaWGrze = zadania.filter((z) => z.typ !== "ciekawostka");
  const lpPytania = (nr: number) => pytaniaWGrze.filter((z) => z.nr <= nr).length;
  // godziny gry jedna pod drugą (29.10): ustawiony start, dołączanie, faktyczny start (pierwsze pytanie) i koniec
  const [{ data: dolaczanie }, { data: pierwszePytanie }] = await Promise.all([
    db.from("gracze").select("dolaczyl").eq("sesja_id", id).order("dolaczyl"),
    db
      .from("odpowiedzi")
      .select("utworzono, czas_ms")
      .eq("sesja_id", id)
      .order("utworzono")
      .limit(1)
      .maybeSingle<{ utworzono: string; czas_ms: number }>(),
  ]);
  const godzina = (kiedy: string | number | null | undefined, zDniem = false) =>
    kiedy == null
      ? null
      : new Date(kiedy).toLocaleString("pl-PL", {
          timeZone: "Europe/Warsaw",
          ...(zDniem ? { day: "numeric", month: "numeric" } : {}),
          hour: "2-digit",
          minute: "2-digit",
        });
  const dolaczyli = (dolaczanie ?? []) as { dolaczyl: string }[];
  // pierwsze pytanie ruszyło czas_ms przed pierwszą odpowiedzią
  // od 29.10 baza zapisuje start (`wystartowano`), starsze gry: z pierwszej odpowiedzi
  const startFaktyczny = gra.wystartowano
    ? gra.wystartowano
    : pierwszePytanie
    ? new Date(pierwszePytanie.utworzono).getTime() - pierwszePytanie.czas_ms
    : null;
  // autor notatki: osoba (od 30.10) i lokal, w którego imieniu pisała, albo Bractwo
  const [{ data: lokalNotatki }, { data: osobaNotatki }] = await Promise.all([
    gra.notatka_lokal_id
      ? db
          .from("lokale")
          .select("nazwa, logo_url")
          .eq("id", gra.notatka_lokal_id)
          .maybeSingle<{ nazwa: string; logo_url: string | null }>()
      : Promise.resolve({ data: null }),
    gra.notatka_konto_id
      ? db.from("konta").select("nazwa").eq("id", gra.notatka_konto_id).maybeSingle<{ nazwa: string }>()
      : Promise.resolve({ data: null }),
  ]);
  const autorNotatki: AutorNotatki = {
    nazwa: [osobaNotatki?.nazwa, lokalNotatki?.nazwa ?? "Bractwo Piwne"].filter(Boolean).join(" · "),
    logo: lokalNotatki ? lokalNotatki.logo_url : "/loga/bractwo-biale.svg",
  };
  const daneGry: [string, string | null][] = [
    ["Lokal", gra.lokale ? `${gra.lokale.nazwa}${gra.lokale.miasto ? `, ${gra.lokale.miasto}` : ""}` : "bez lokalu"],
    ["Okazja", gra.okazja],
    ["Kto uruchomił", gra.konta?.nazwa ?? null],
    ["Start ustawiony", godzina(gra.planowany_start, true)],
    ["Pierwszy gracz", godzina(dolaczyli[0]?.dolaczyl, !gra.planowany_start)],
    ["Ostatni gracz", dolaczyli.length > 1 ? godzina(dolaczyli[dolaczyli.length - 1].dolaczyl) : null],
    [gra.wystartowano ? "Start faktyczny" : "Pierwsze pytanie", godzina(startFaktyczny)],
    ["Koniec", !trwa ? godzina(gra.faza_od) : null],
    ["Graczy", `${gracze ?? 0}/${gra.max_graczy}`],
    ["Czas na odpowiedź", gra.czas_s === null ? "bez limitu" : `${gra.czas_s} s`],
    ["Bonus za szybkość", gra.bonus_czas ? "tak" : "nie"],
    ["Nagrody", gra.nagrody?.length ? gra.nagrody.map((n) => `${n.miejsce}. ${n.nagroda}`).join(", ") : null],
    ["Kranoprzejęcie", gra.browar_nazwa],
    // „każdy sam” to jedyny tryb od 26.10, więc piszemy tylko o drużynach (starsze gry)
    ["Tryb", gra.tryb === "druzyny" ? "drużyny" : null],
    ["Prowadzenie", gra.auto ? "automatyczne" : null],
    ["Poczekalnia", !gra.poczekalnia_otwarta && trwa ? "zamknięta (zapowiedź)" : null],
  ];
  // przegląd pytań: wszystkie odpowiedzi z treścią i gracze z etapem odpadnięcia
  const [{ data: odpowiedziGry }, { data: graczeGry }] =
    !trwa && widokPytan
      ? await Promise.all([
          db
            .from("odpowiedzi")
            .select("gracz_id, zadanie_id, dane, czas_ms, poprawna, punkty, ocena")
            .eq("sesja_id", gra.id)
            .returns<OdpowiedzGracza[]>(),
          db
            .from("gracze")
            .select("id, nick, zdjecie_url, odpadl_po_etapie")
            .eq("sesja_id", gra.id)
            .returns<{ id: string; nick: string; zdjecie_url: string | null; odpadl_po_etapie: number | null }[]>(),
        ])
      : [{ data: [] as OdpowiedzGracza[] }, { data: [] }];
  const graczePrzegladu: GraczPrzegladu[] = (graczeGry ?? []).map((g) => ({
    id: g.id,
    nick: g.nick,
    zdjecie: g.zdjecie_url,
    odpadlPoEtapie: g.odpadl_po_etapie,
  }));
  // SVG z biblioteki qrcode, bez danych od użytkownika poza adresem, który sami złożyliśmy
  const qrPilota = trwa ? await QRCode.toString(linki.pilot, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) : null;

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/gry">← Rozgrywki</Link>
      </p>
      {/* zakończona gra nie ma prawej kolumny (prowadzenie, ekran), więc dane gry idą na całą szerokość */}
      <div className={trwa ? "uklad-dwa" : "stos"}>
        <div className="stos">
          <p className="pomocniczy">
            Kod gry · <span className={`znaczek${trwa ? " aktywny" : ""}`}>{NAZWY_FAZ[gra.faza]}</span>
          </p>
          <div className="kod-gry">{gra.kod}</div>
          <h1>{gra.quizy?.tytul ?? "quiz usunięty"}</h1>
          <dl className="dane-gry">
            {daneGry
              .filter(([, wartosc]) => wartosc)
              .map(([nazwa, wartosc]) => (
                <div key={nazwa}>
                  <dt>{nazwa}</dt>
                  <dd>{wartosc}</dd>
                </div>
              ))}
          </dl>

          {!gosc && trwa && (
          <section className="panel-sekcja akcje-gry">
            {(
              <PrzyciskPotwierdz
                akcja={zakonczGre.bind(null, gra.id)}
                pytanie={`Zakończyć grę ${gra.kod}? Gracze nie będą mogli już dołączyć ani odpowiadać.`}
                tak="Zakończ grę"
                className="przycisk-maly"
              >
                Zakończ grę
              </PrzyciskPotwierdz>
            )}
          </section>
          )}
        </div>

        {trwa && qrPilota ? (
          <div>
            <section className="panel-sekcja karta">
              <h2>Prowadzenie</h2>
              <a href={linki.pilot} className="przycisk zloty">
                Prowadź z tego urządzenia
              </a>
              <details className="przekaz">
                <summary>Przekaż prowadzącemu (kod QR)</summary>
                <p className="pomocniczy">Nie pokazuj graczom: link prowadzi do pilota.</p>
                <div className="qr" dangerouslySetInnerHTML={{ __html: qrPilota }} />
                <LinkDoSkopiowania url={linki.pilot} />
              </details>
            </section>

            <section className="panel-sekcja karta">
              <h2>Ekran</h2>
              {linki.ekranLokalu ? (
                <>
                  <LinkDoSkopiowania url={linki.ekranLokalu} />
                  {!!inneGry?.length && (
                    <p className="blad">
                      W tym lokalu trwa też gra {inneGry.map((g) => g.kod).join(", ")}. Ekran lokalu pokazuje najnowszą, czyli
                      tę. Zakończ starą, jeśli już nie jest potrzebna.
                    </p>
                  )}
                </>
              ) : (
                <LinkDoSkopiowania url={linki.ekran} />
              )}
            </section>

            <section className="panel-sekcja karta">
              <h2>Gracze</h2>
              <LinkDoSkopiowania url={linki.gracz} />
            </section>
          </div>
        ) : null}
      </div>

      {/* notatka prowadzącego na całą szerokość: lokal-gość (gra Bractwa u niego) jej nie widzi */}
      {!gosc && (
        <section className="panel-sekcja">
          <h2>Notatka</h2>
          <Notatki
            graId={gra.id}
            notatka={gra.notatka ?? null}
            autor={autorNotatki}
            zmieniono={gra.notatka_zmieniono ?? null}
          />
        </section>
      )}

      {!trwa && !!gra.nagrody?.length && (
        <section className="panel-sekcja">
          <h2>Nagrody</h2>
          <ul className="lista">
            {gra.nagrody.flatMap((n) => {
              const zdobywcy = wyniki.filter((w) => w.miejsce === n.miejsce);
              if (zdobywcy.length === 0) {
                return [
                  <li key={`${n.miejsce}`}>
                    <div className="lista-glowna">
                      <div className="lista-tytul">
                        {n.miejsce}. miejsce · {n.nagroda}
                      </div>
                      <div className="lista-opis">Nikt nie zajął tego miejsca.</div>
                    </div>
                  </li>,
                ];
              }
              return zdobywcy.map((w) => (
                <li key={`${n.miejsce}-${w.id}`}>
                  <div className="lista-glowna">
                    <div className="lista-tytul">
                      {n.miejsce}. miejsce · {n.nagroda}
                    </div>
                    <div className="lista-opis">{w.nick}</div>
                  </div>
                  <span className={`znaczek${w.nagrodaOdebrana ? " aktywny" : ""}`}>
                    {w.nagrodaOdebrana
                      ? `odebrana ${new Date(w.nagrodaOdebrana).toLocaleString("pl-PL", {
                          timeZone: "Europe/Warsaw",
                          day: "numeric",
                          month: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "jeszcze nieodebrana"}
                  </span>
                  {!gosc && (
                  <PrzyciskPotwierdz
                    akcja={ustawOdbiorNagrody.bind(null, gra.id, w.id, !w.nagrodaOdebrana)}
                    pytanie={
                      w.nagrodaOdebrana
                        ? `Cofnąć odbiór nagrody „${n.nagroda}” dla ${w.nick}? Karta na telefonie znów będzie do odebrania.`
                        : `Oznaczyć nagrodę „${n.nagroda}” jako odebraną przez ${w.nick}?`
                    }
                    tak={w.nagrodaOdebrana ? "Cofnij odbiór" : "Oznacz odbiór"}
                    className="przycisk-maly"
                  >
                    {w.nagrodaOdebrana ? "Cofnij" : "Oznacz odbiór"}
                  </PrzyciskPotwierdz>
                  )}
                </li>
              ));
            })}
          </ul>
        </section>
      )}

      {!trwa && (
        <section className="panel-sekcja" id="wyniki">
          <h2>Wyniki</h2>
          <nav className="zakladki" aria-label="Widok wyników">
            {[
              ["gracze", "Gracze", `/admin/gry/${gra.id}#wyniki`],
              ["pytania", "Pytania", `/admin/gry/${gra.id}?widok=pytania#wyniki`],
            ].map(([klucz, napis, href]) => (
              <Link
                key={klucz}
                href={href}
                scroll={false}
                aria-current={(klucz === "pytania") === widokPytan ? "page" : undefined}
              >
                {napis}
              </Link>
            ))}
          </nav>
          {!widokPytan && wyniki.some((w) => w.punkty > 0) && (
            <GrafikaPodium
              dane={{
                tytul: gra.quizy?.tytul ?? "Quiz",
                // bez okazji rodzaj gry, jak na grafice gracza
                okazja: gra.okazja ?? ((gra.quizy?.etapy[0]?.count ?? 0) > 0 ? "Wyścig po piwo" : "Pub quiz"),
                lokal: gra.lokale ? { nazwa: gra.lokale.nazwa, logo_url: gra.lokale.logo_url } : null,
                browar: gra.browar_nazwa ? { nazwa: gra.browar_nazwa, logo_url: gra.browar_logo_url } : null,
                data: new Date(gra.faza_od ?? gra.utworzono).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" }),
                podium: wyniki
                  .filter((w) => w.miejsce <= 3 && w.punkty > 0)
                  .slice(0, 3)
                  .map((w) => ({
                    nick: w.nick,
                    zdjecie: w.zdjecie,
                    miejsce: w.miejsce,
                    // miejsca finalistów ustalił wyścig, nie punkty (finał bez punktów, 27.10)
                    punkty: miejsceZWyscigu(w.miejsce, gra.finalisci?.length) ? null : w.punkty,
                  })),
              }}
              konta={[gra.lokale?.instagram ?? null, gra.browar_instagram]}
            />
          )}
          {widokPytan ? (
            <PrzegladPytan
              graId={gra.id}
              zadania={zadania}
              odpowiedzi={odpowiedziGry ?? []}
              gracze={graczePrzegladu}
            />
          ) : (
            <TabelaWynikow
              graId={gra.id}
              wyniki={wyniki}
              liczbaPytan={pytanEtapow}
              usunieci={usunieci}
              lpPytania={lpPytania}
            />
          )}
        </section>
      )}

      {/* usuwanie na samym dole strony (29.10), z dala od notatki i wyników */}
      {!gosc && (
        <section className="panel-sekcja akcje-gry">
          <PrzyciskPotwierdz
            akcja={usunGre.bind(null, gra.id, true)}
            pytanie={
              trwa
                ? `Gra ${gra.kod} jeszcze trwa. Usunąć ją razem z graczami i wynikami? Ekrany graczy i TV pokażą, że gry nie ma.`
                : `Usunąć grę ${gra.kod} razem z graczami i wynikami?`
            }
          >
            <IkonaKosz /> Usuń grę
          </PrzyciskPotwierdz>
        </section>
      )}
    </main>
  );
}
