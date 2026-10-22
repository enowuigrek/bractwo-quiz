import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { Miniatura } from "../_komponenty/grafika";
import { IkonaEdytuj } from "../_komponenty/ikony";

export const metadata: Metadata = { title: "Ustawienia: lokale · Bractwo Quiz" };

export default async function Lokale() {
  await wymagajAdmina();
  const { data, error } = await supabaseAdmin()
    .from("lokale")
    .select("id, nazwa, miasto, logo_url, adres_ekranu")
    .order("miasto")
    .order("nazwa")
    .returns<Lokal[]>();

  const lokale = data ?? [];
  const miasta = [...new Set(lokale.map((p) => p.miasto ?? "bez miasta"))];

  return (
    <main>
      <p className="okruchy">Ustawienia</p>
      <h1>Lokale</h1>
      {error && <p className="blad">Nie udało się pobrać lokali: {error.message}</p>}

      {miasta.map((miasto) => (
        <section key={miasto} className="panel-sekcja">
          <h2>{miasto}</h2>
          <ul className="lista">
            {lokale
              .filter((p) => (p.miasto ?? "bez miasta") === miasto)
              .map((p) => (
                <li key={p.id}>
                  <Miniatura src={p.logo_url} alt="" />
                  <div className="lista-glowna">
                    <div className="lista-tytul">
                      <Link href={`/admin/lokale/${p.id}`}>{p.nazwa}</Link>
                    </div>
                    <div className="lista-opis">ekran: /ekran/{p.adres_ekranu}</div>
                  </div>
                  <div className="lista-akcje">
                    <Link
                      href={`/admin/lokale/${p.id}`}
                      className="przycisk-maly ikona"
                      aria-label={`Edytuj lokal ${p.nazwa}`}
                      data-podpis="Edytuj"
                    >
                      <IkonaEdytuj />
                    </Link>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
      {!error && lokale.length === 0 && <p className="lista-pusta">Nie ma jeszcze żadnego lokalu.</p>}

      <p className="panel-sekcja">
        <Link href="/admin/lokale/nowy" className="przycisk zloty">
          Dodaj lokal
        </Link>
      </p>
    </main>
  );
}
