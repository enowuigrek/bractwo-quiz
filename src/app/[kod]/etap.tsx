import { Awatar } from "@/components/awatar";
import { napisMnoznika } from "@/lib/etapy";
import type { StanSesji } from "@/lib/gra/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { czyKibic } from "./rozgrywka";

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
        <span className="gra-kod">{e.liczba_pytan === 1 ? "1 pytanie" : `${e.liczba_pytan} pyt.`}</span>
      </p>
      <h1 className="etap-nazwa">{e.nazwa}</h1>
      {e.opis && <p className="etap-opis">{e.opis}</p>}
      <ul className="etap-cechy">
        {e.mnoznik !== 1 && <li className="zloty">Punkty {napisMnoznika(e.mnoznik)}</li>}
        <li>
          {e.czas_s
            ? e.seria
              ? `${e.czas_s} s na całą serię`
              : `${e.czas_s} s na odpowiedź`
            : "Kto pierwszy, ten lepszy"}
        </li>
        {e.seria && <li className="zloty">Seria: kto pierwszy dobiegnie do piwa</li>}
        {e.typy.map((t) => (
          <li key={t}>{NAZWY_TYPOW[t]}</li>
        ))}
      </ul>
      {e.typy.includes("pary") && (
        <p className="etap-uwaga">📱 Telefon trzymaj pionowo. Wybierz element z lewej kolumny, a potem pasujący z prawej.</p>
      )}
      {e.final_po_etapie && (
        <p className="etap-uwaga">
          🏆 Po tym etapie <strong>3 najlepszych wchodzi do finału</strong>
          {stan.liczba_graczy > 3 ? `, ${stan.liczba_graczy - 3} odpada i kibicuje` : ""}. Walcz o miejsce w trójce!
        </p>
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
            <p className="pomocniczy">Tym razem kibicujesz. Pytania i tak zobaczysz tutaj.</p>
          )}
        </section>
      )}
    </>
  );
}
