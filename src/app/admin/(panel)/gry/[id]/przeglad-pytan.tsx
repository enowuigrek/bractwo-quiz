import Link from "next/link";
import { Awatar } from "@/components/awatar";
import { sekundy } from "@/lib/czas";
import { LITERY, NAZWY_TYPOW, liczbaCzesci, opisOdpowiedzi, opisRozwiazania, ulamek } from "@/lib/zadania";
import type { OdpowiedzGracza, ZadanieGry } from "../wyniki";

export type GraczPrzegladu = { id: string; nick: string; zdjecie: string | null; odpadlPoEtapie: number | null };

/**
 * Wyniki od strony pytań (29.10): każde pytanie to zwijana karta. W wyborze i prawda/fałsz pod każdą odpowiedzią
 * stoją gracze, którzy ją wybrali (od najszybszego), jak „dobrze / źle” na TV; w pozostałych rodzajach lista graczy
 * od najlepszej odpowiedzi. Na końcu ci, którzy nie odpowiedzieli (bez odpadniętych wcześniej i bez kibiców finału).
 */
export function PrzegladPytan({
  graId,
  zadania,
  odpowiedzi,
  gracze,
}: {
  graId: string;
  zadania: ZadanieGry[];
  odpowiedzi: OdpowiedzGracza[];
  gracze: GraczPrzegladu[];
}) {
  const pytania = zadania.filter((z) => z.typ !== "ciekawostka");
  // finał serią: każdy dostał pulę w swojej kolejności, więc tylko pytania, na które ktoś odpowiedział
  const zOdpowiedziami = new Set(odpowiedzi.map((o) => o.zadanie_id));
  const etapowe = pytania.filter((z) => !z.zSerii);
  const finalowe = pytania.filter((z) => z.zSerii && zOdpowiedziami.has(z.id));
  if (etapowe.length + finalowe.length === 0) return <p className="lista-pusta">W tej grze nie padło żadne pytanie.</p>;

  const gracz = new Map(gracze.map((g) => [g.id, g]));
  const karta = (z: ZadanieGry, lp: string) => (
    <KartaPytania
      key={z.id}
      graId={graId}
      z={z}
      lp={lp}
      odpowiedzi={odpowiedzi.filter((o) => o.zadanie_id === z.id && gracz.has(o.gracz_id))}
      gracz={gracz}
      // nie odpowiedział ten, kto wtedy grał: bez odpadniętych przed tym etapem; w finale nie liczymy (każdy ma inne)
      grajacy={
        z.zSerii
          ? []
          : gracze.filter((g) => g.odpadlPoEtapie === null || z.etapNr === null || g.odpadlPoEtapie >= z.etapNr)
      }
    />
  );
  return (
    <div className="przeglad-pytan">
      {etapowe.map((z, i) => karta(z, `${i + 1}.`))}
      {finalowe.length > 0 && (
        <>
          <h3 className="przeglad-final">Finał</h3>
          {finalowe.map((z, i) => karta(z, `F${i + 1}.`))}
        </>
      )}
    </div>
  );
}

function KartaPytania({
  graId,
  z,
  lp,
  odpowiedzi,
  gracz,
  grajacy,
}: {
  graId: string;
  z: ZadanieGry;
  lp: string;
  odpowiedzi: OdpowiedzGracza[];
  gracz: Map<string, GraczPrzegladu>;
  grajacy: GraczPrzegladu[];
}) {
  const dobre = odpowiedzi.filter((o) => o.poprawna).length;
  const najszybszy = odpowiedzi.filter((o) => o.poprawna).sort((a, b) => a.czas_ms - b.czas_ms)[0];
  const odpowiedzieli = new Set(odpowiedzi.map((o) => o.gracz_id));
  const bezOdpowiedzi = grajacy.filter((g) => !odpowiedzieli.has(g.id));
  const zOpcjami = z.typ === "wybor" || z.typ === "prawda_falsz";

  const graczOdp = (o: OdpowiedzGracza, zOpisem: boolean) => {
    const g = gracz.get(o.gracz_id)!;
    const czesciowo = !o.poprawna && (o.ocena ?? 0) > 0;
    return (
      <li key={o.gracz_id} className={`przeglad-gracz ${o.poprawna ? "dobrze" : czesciowo ? "czesciowo" : "zle"}`}>
        <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={28} />
        <Link href={`/admin/gry/${graId}/gracze/${g.id}`} className="przeglad-nick">
          {g.nick}
        </Link>
        {zOpisem && (
          <span className="przeglad-odp">
            {opisOdpowiedzi(z, o.dane)}
            {czesciowo &&
              (z.typ === "szacowanie"
                ? ` (blisko: ${Math.round((o.ocena ?? 0) * 100)}%)`
                : ` (${ulamek(o.ocena ?? 0, liczbaCzesci(z.typ, z.dane))})`)}
          </span>
        )}
        <span className="historia-czas">{sekundy(o.czas_ms)}</span>
        <span className="przeglad-punkty">{o.punkty > 0 ? `+${o.punkty}` : "0"}</span>
      </li>
    );
  };

  return (
    <details className="karta karta-zwijana przeglad-karta">
      <summary>
        <span className="przeglad-naglowek">
          <span className="przeglad-lp">{lp}</span>
          <span className="przeglad-tresc">
            <span className={`rodzaj-pytania ${z.typ}`}>{NAZWY_TYPOW[z.typ]}</span>
            <strong>{z.tresc}</strong>
            <span className="lista-opis">
              {odpowiedzi.length === 0
                ? "nikt nie odpowiedział"
                : `dobrze ${dobre} z ${odpowiedzi.length}${
                    najszybszy
                      ? ` · najszybciej ${gracz.get(najszybszy.gracz_id)?.nick} (${sekundy(najszybszy.czas_ms)})`
                      : ""
                  }`}
            </span>
          </span>
        </span>
        <span className={`przeglad-wynik${odpowiedzi.length && dobre === odpowiedzi.length ? " wszyscy" : ""}`}>
          {dobre}/{odpowiedzi.length}
        </span>
      </summary>

      {zOpcjami ? (
        <ol className="przeglad-opcje">
          {z.dane.odpowiedzi.map((tekst, i) => {
            const wybrali = odpowiedzi.filter((o) => o.dane.odpowiedz === i).sort((a, b) => a.czas_ms - b.czas_ms);
            const poprawna = z.dane.poprawna === i;
            return (
              <li key={i} className={`przeglad-opcja${poprawna ? " poprawna" : ""}`}>
                <div className="przeglad-opcja-tytul">
                  {z.typ === "wybor" && <span className="historia-litera">{LITERY[i]}</span>}
                  <span className="przeglad-opcja-tekst">{tekst}</span>
                  <span className="przeglad-ile">{wybrali.length}</span>
                </div>
                {wybrali.length > 0 && <ul className="przeglad-gracze">{wybrali.map((o) => graczOdp(o, false))}</ul>}
              </li>
            );
          })}
        </ol>
      ) : (
        <>
          <p className="lista-opis przeglad-rozwiazanie">{opisRozwiazania(z)}</p>
          <ul className="przeglad-gracze">
            {[...odpowiedzi]
              .sort((a, b) => (b.ocena ?? 0) - (a.ocena ?? 0) || a.czas_ms - b.czas_ms)
              .map((o) => graczOdp(o, true))}
          </ul>
        </>
      )}

      {bezOdpowiedzi.length > 0 && (
        <p className="lista-opis przeglad-brak">Bez odpowiedzi: {bezOdpowiedzi.map((g) => g.nick).join(", ")}</p>
      )}
    </details>
  );
}
