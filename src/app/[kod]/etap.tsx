import { Awatar } from "@/components/awatar";
import { napisMnoznika } from "@/lib/etapy";
import { kolejneOdciecia } from "@/lib/gra/odpadanie";
import type { StanSesji } from "@/lib/gra/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { czyKibic } from "./rozgrywka";
import { IkonaPuchar } from "@/components/ikony";

/** Telefon w fazie `etap`: nazwa i zasady etapu, mnożnik, a w finale trójki: grasz czy kibicujesz. */
export function EtapGracza({ stan, nick }: { stan: StanSesji; nick: string }) {
  const e = stan.etap;
  if (!e) return <p className="pomocniczy">Za chwilę start.</p>;
  const kibic = czyKibic(stan, nick);
  return (
    <>
      <p className="nadtytul">{nick}</p>
      <p className="etykieta gra-pasek">
        <span>
          Etap {e.nr} z {e.liczba}
        </span>
        {!e.finalowy && (
          <span className="gra-kod">{e.liczba_pytan === 1 ? "1 pytanie" : `${e.liczba_pytan} pyt.`}</span>
        )}
      </p>
      <h1 className="etap-nazwa">{e.nazwa}</h1>
      {e.opis && <p className="etap-opis">{e.opis}</p>}
      <ul className="etap-cechy">
        {e.mnoznik !== 1 && <li className="zloty">Punkty {napisMnoznika(e.mnoznik)}</li>}
        {/* bez limitu nic: że szybciej = więcej punktów, mówi opis etapu */}
        {e.czas_s && <li>{e.seria ? `${e.czas_s} s na całą serię` : `${e.czas_s} s na odpowiedź`}</li>}
        {e.seria && <li className="zloty">Seria: kto pierwszy dobiegnie do piwa</li>}
        {e.typy.map((t) => (
          <li key={t}>{NAZWY_TYPOW[t]}</li>
        ))}
      </ul>
      {e.typy.includes("pary") && (
        <p className="etap-uwaga">Łączenie: stuknij element z jednej kolumny, a potem pasujący z drugiej.</p>
      )}
      {e.final_po_etapie ? (
        <p className="etap-uwaga">
          <IkonaPuchar /> Po tym etapie <strong>3 najlepszych wchodzi do finału</strong>
          {stan.w_grze > 3 ? `, ${stan.w_grze - 3} odpada i kibicuje` : ""}. Walcz o miejsce w trójce!
        </p>
      ) : e.przechodzi !== null && stan.w_grze > e.przechodzi ? (
        <p className="etap-uwaga">
          Po tym etapie gra dalej <strong>{e.przechodzi} najlepszych</strong>, {stan.w_grze - e.przechodzi} odpada i
          kibicuje. Walcz o miejsce nad kreską!
        </p>
      ) : (
        !e.finalowy &&
        kolejneOdciecia(stan, e.nr + 1).length > 0 && (
          <p className="etap-uwaga">Po drodze odpada się: {kolejneOdciecia(stan, e.nr + 1).join(", ")}.</p>
        )
      )}
      {stan.finalisci && (
        <section className="etap-final">
          <p className="etykieta">{kibic ? "Grają w finale" : "Jesteś w finale!"}</p>
          <ul className="nicki">
            {stan.finalisci.map((f) => (
              <li key={f.nick} className={f.nick === nick ? "ja" : undefined}>
                <Awatar nick={f.nick} zdjecie={f.zdjecie} rozmiar={26} />
                {f.nick}
              </li>
            ))}
          </ul>
          {kibic && (
            <p className="pomocniczy">
              {e.seria
                ? "Tym razem kibicujesz: w trakcie finału dopingujesz finalistów z telefonu."
                : "Tym razem kibicujesz. Pytania i tak zobaczysz tutaj."}
            </p>
          )}
        </section>
      )}
    </>
  );
}
