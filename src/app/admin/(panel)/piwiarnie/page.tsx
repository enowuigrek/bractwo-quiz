import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Piwiarnia } from "@/lib/typy";
import { Miniatura } from "../_komponenty/grafika";
import { FormularzPiwiarni } from "./formularz";

export const metadata: Metadata = { title: "Piwiarnie · Bractwo Quiz" };

export default async function Piwiarnie() {
  await wymagajAdmina();
  const { data, error } = await supabaseAdmin()
    .from("piwiarnie")
    .select("id, nazwa, miasto, logo_url")
    .order("miasto")
    .order("nazwa")
    .returns<Piwiarnia[]>();

  const piwiarnie = data ?? [];
  const miasta = [...new Set(piwiarnie.map((p) => p.miasto ?? "bez miasta"))];

  return (
    <main>
      <h1>Piwiarnie</h1>
      {error && <p className="blad">Nie udało się pobrać lokali: {error.message}</p>}

      {miasta.map((miasto) => (
        <section key={miasto} className="panel-sekcja">
          <h2>{miasto}</h2>
          <ul className="lista">
            {piwiarnie
              .filter((p) => (p.miasto ?? "bez miasta") === miasto)
              .map((p) => (
                <li key={p.id}>
                  <Miniatura src={p.logo_url} alt="" />
                  <div className="lista-glowna lista-tytul">
                    <Link href={`/admin/piwiarnie/${p.id}`}>{p.nazwa}</Link>
                  </div>
                  <div className="lista-akcje">
                    <Link href={`/admin/piwiarnie/${p.id}`} className="przycisk-maly">
                      Edytuj
                    </Link>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
      {!error && piwiarnie.length === 0 && <p className="lista-pusta">Nie ma jeszcze żadnego lokalu.</p>}

      <section className="panel-sekcja karta">
        <h2>Dodaj lokal</h2>
        <FormularzPiwiarni miasta={miasta.filter((m) => m !== "bez miasta")} />
      </section>
    </main>
  );
}
