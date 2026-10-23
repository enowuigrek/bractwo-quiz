import { Awatar } from "@/components/awatar";
import { napisMnoznika } from "@/lib/etapy";
import type { StanSesji } from "@/lib/gra/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { czyKibic } from "./rozgrywka";

/** Telefon w fazie `etap`: nazwa i zasady etapu, mnożnik, a w finale trójki: grasz czy kibicujesz. */
export function EtapGracza({ stan, nick }: { stan: StanSesji; nick: string }) {
  const e = stan.etap;
  if (!e) return <p className="pomocniczy">Patrz na telewizor.</p>;
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
        {e.czas_s && <li>{e.czas_s} s na odpowiedź</li>}
        {e.typy.map((t) => (
          <li key={t}>{NAZWY_TYPOW[t]}</li>
        ))}
      </ul>
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
            <p className="pomocniczy">Tym razem kibicujesz. Pytania zobaczysz na telefonie i na telewizorze.</p>
          )}
        </section>
      )}
      <p className="pomocniczy">Prowadzący zaraz wystartuje etap. Patrz na telewizor.</p>
    </>
  );
}
