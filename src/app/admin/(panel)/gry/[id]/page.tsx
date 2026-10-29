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
import { usunieciGry, wynikiGry, zadaniaGry } from "../wyniki";
import { miejsceZWyscigu } from "@/lib/gra/final";
import { GrafikaPodium } from "./grafika-podium";
import { LinkDoSkopiowania } from "./kopiuj";
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
};

export default async function Gra({ params }: PageProps<"/admin/gry/[id]">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
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
    db.from("sesje").select("*, quizy(tytul, etapy(count)), lokale(nazwa, miasto, adres_ekranu, logo_url, instagram)").eq("id", id).maybeSingle<GraZDanymi>(),
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
  // SVG z biblioteki qrcode, bez danych od użytkownika poza adresem, który sami złożyliśmy
  const qrPilota = trwa ? await QRCode.toString(linki.pilot, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) : null;

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/gry">← Rozgrywki</Link>
      </p>
      <div className="uklad-dwa">
        <div>
          <p className="pomocniczy" style={{ margin: 0 }}>
            Kod gry · <span className={`znaczek${trwa ? " aktywny" : ""}`}>{NAZWY_FAZ[gra.faza]}</span>
          </p>
          <div className="kod-gry">{gra.kod}</div>
          <h1 style={{ marginTop: 16 }}>{gra.quizy?.tytul ?? "quiz usunięty"}</h1>
          <p className="pomocniczy">
            {[
              gra.lokale ? `${gra.lokale.nazwa}${gra.lokale.miasto ? `, ${gra.lokale.miasto}` : ""}` : "bez lokalu",
              gra.okazja,
              gra.planowany_start
                ? `start ${new Date(gra.planowany_start).toLocaleString("pl-PL", {
                    timeZone: "Europe/Warsaw",
                    day: "numeric",
                    month: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : null,
              !gra.poczekalnia_otwarta && trwa ? "zapowiedź (poczekalnia zamknięta)" : null,
              gra.auto ? "prowadzenie automatyczne" : null,
              gra.browar_nazwa ? `kranoprzejęcie: ${gra.browar_nazwa}` : null,
              // „każdy sam” to jedyny tryb od 26.10, więc piszemy tylko o drużynach (starsze gry)
              gra.tryb === "druzyny" ? "drużyny" : null,
              gra.czas_s === null ? "bez limitu czasu" : `${gra.czas_s} s na odpowiedź`,
              gra.bonus_czas ? "z bonusem za szybkość" : "bez bonusu",
              `graczy: ${gracze ?? 0}/${gra.max_graczy}`,
              gra.nagrody?.length ? `nagrody: ${gra.nagrody.map((n) => `${n.miejsce}. ${n.nagroda}`).join(", ")}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {gosc ? (
            <p className="pomocniczy">Grę ustawiło Bractwo Piwne: możesz oglądać wyniki i pobrać grafiki.</p>
          ) : (
          <section className="panel-sekcja akcje-gry">
            {trwa && (
              <PrzyciskPotwierdz
                akcja={zakonczGre.bind(null, gra.id)}
                pytanie={`Zakończyć grę ${gra.kod}? Gracze nie będą mogli już dołączyć ani odpowiadać.`}
                tak="Zakończ grę"
                className="przycisk-maly"
              >
                Zakończ grę
              </PrzyciskPotwierdz>
            )}
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
        </div>

        {trwa && qrPilota ? (
          <div>
            <section className="panel-sekcja karta">
              <h2>Prowadzenie</h2>
              <p className="pomocniczy" style={{ marginTop: 0 }}>
                Prowadzisz sam? Otwórz pilota na tym urządzeniu (telefon albo laptop). Grę możesz też przekazać komuś innemu.
              </p>
              <a href={linki.pilot} className="przycisk zloty">
                Prowadź z tego urządzenia
              </a>
              <details className="przekaz">
                <summary>Przekaż prowadzącemu (kod QR)</summary>
                <p className="pomocniczy">
                  Prowadzący skanuje ten kod i ma pilota. Link zawiera tajny klucz, nie pokazuj go graczom.
                </p>
                <div className="qr" dangerouslySetInnerHTML={{ __html: qrPilota }} />
                <div style={{ marginTop: 14 }}>
                  <LinkDoSkopiowania url={linki.pilot} />
                </div>
              </details>
            </section>

            <section className="panel-sekcja karta">
              <h2>Ekran</h2>
              {linki.ekranLokalu ? (
                <>
                  <p className="pomocniczy" style={{ marginTop: 0 }}>
                    {gra.poczekalnia_otwarta
                      ? `Ekran lokalu ${gra.lokale?.nazwa} przełączy się na tę grę sam.`
                      : `Ekran lokalu ${gra.lokale?.nazwa} pokazuje zapowiedź z odliczaniem. QR pojawi się, gdy otworzysz poczekalnię na pilocie.`}{" "}
                    Jeśli TV nie ma go w zakładkach, otwórz:
                  </p>
                  <LinkDoSkopiowania url={linki.ekranLokalu} />
                  {!!inneGry?.length && (
                    <p className="blad" style={{ marginBottom: 0 }}>
                      W tym lokalu trwa też gra {inneGry.map((g) => g.kod).join(", ")}. Ekran lokalu pokazuje najnowszą, czyli
                      tę. Zakończ starą, jeśli już nie jest potrzebna.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="pomocniczy" style={{ marginTop: 0 }}>
                    Otwórz w przeglądarce na TV. Na ekranie pojawi się kod QR dla graczy.
                  </p>
                  <LinkDoSkopiowania url={linki.ekran} />
                </>
              )}
            </section>

            <section className="panel-sekcja karta">
              <h2>Gracze</h2>
              <p className="pomocniczy" style={{ marginTop: 0 }}>
                Gracze skanują QR z telewizora albo wpisują kod <strong>{gra.kod}</strong> na stronie głównej.
              </p>
              <LinkDoSkopiowania url={linki.gracz} />
            </section>
            <p className="podpowiedz">Kliknij link, żeby otworzyć go w nowej karcie. Ikona obok albo przytrzymanie palcem kopiuje.</p>
          </div>
        ) : null}
      </div>

      {!trwa && !!gra.nagrody?.length && (
        <section className="panel-sekcja">
          <h2>Nagrody</h2>
          <p className="pomocniczy" style={{ marginTop: 0 }}>
            Zwycięzca klika na telefonie „Potwierdź odbiór”, gdy dostanie nagrodę. Godzina pojawia się tutaj. Jeśli z
            telefonu się nie udało, oznacz odbiór tutaj: telefon gracza też pokaże „Odebrana”.
          </p>
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
        <section className="panel-sekcja">
          <h2>Wyniki</h2>
          <p className="pomocniczy" style={{ marginTop: 0 }}>
            {pytanEtapow > 0
              ? `Pytań w grze: ${pytanEtapow}${zadaniaSerii.size ? " i finał (każdy finalista tyle, na ile zdążył)" : ""}. `
              : ""}
            Kliknij gracza, żeby zobaczyć jego odpowiedzi i czasy.
          </p>
          {wyniki.some((w) => w.punkty > 0) && (
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
          <TabelaWynikow
            graId={gra.id}
            wyniki={wyniki}
            liczbaPytan={pytanEtapow}
            usunieci={usunieci}
            lpPytania={lpPytania}
          />
        </section>
      )}
    </main>
  );
}
