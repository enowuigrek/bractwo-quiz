/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase */
import type { Metadata } from "next";
import { kodAktywnejRoli, roleDoWyboru, wymagajAdmina } from "@/lib/admin";
import { przelaczRole, wylogujAdmina } from "../../akcje";
import { FormularzImienia, FormularzZmianyHasla } from "./formularz";

export const metadata: Metadata = { title: "Moje konto · Bractwo Quiz" };

/** Moje konto (30.10): „działam jako” (gdy jest z czego wybrać), imię i hasło. */
export default async function MojeKonto() {
  const rola = await wymagajAdmina();
  const role = await roleDoWyboru(rola);
  const aktywna = kodAktywnejRoli(rola);
  return (
    <main>
      <p className="okruchy">{rola.konto.email}</p>
      <h1>{rola.konto.nazwa}</h1>
      {role.length > 1 && (
        <section className="panel-sekcja">
          <h2>Działam jako</h2>
          <div className="kafelki-rol">
            {role.map((r) => (
              <form key={r.kod} action={przelaczRole.bind(null, r.kod)}>
                <button
                  type="submit"
                  className={`kafelek-roli${r.kod === aktywna ? " wybrana" : ""}`}
                  aria-pressed={r.kod === aktywna}
                >
                  {r.logo_url ? (
                    <img src={r.logo_url} alt="" />
                  ) : (
                    <img src="/loga/bractwo.svg" alt="" className="logo-bractwo" />
                  )}
                  <span>{r.nazwa}</span>
                </button>
              </form>
            ))}
          </div>
        </section>
      )}
      <div className="uklad-dwa panel-sekcja">
        <section className="karta">
          <h2>Imię</h2>
          <FormularzImienia nazwa={rola.konto.nazwa} />
        </section>
        <section className="karta">
          <h2>Hasło</h2>
          <FormularzZmianyHasla />
        </section>
      </div>
      {/* „Wyloguj” tutaj, a nie w nagłówku (30.10, Łukasz); na telefonie jest też na dole menu */}
      <form action={wylogujAdmina} className="panel-sekcja przyciski">
        <button type="submit" className="przycisk">
          Wyloguj
        </button>
      </form>
    </main>
  );
}
