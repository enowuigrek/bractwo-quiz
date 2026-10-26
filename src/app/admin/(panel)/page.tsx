import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { widoczne } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "./gry/lista-gier";

export default async function Panel() {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();
  const [lokale, quizy, trwajace] = await Promise.all([
    db.from("lokale").select("*", { count: "exact", head: true }),
    db
      .from("quizy")
      .select("*", { count: "exact", head: true })
      .in("tylko_glowny", widoczne(rola))
      .is("usunieto", null),
    db
      .from("sesje")
      .select(ZAPYTANIE_GIER)
      .in("tylko_glowny", widoczne(rola))
      .neq("faza", "koniec")
      .order("utworzono", { ascending: false })
      .returns<GraNaLiscie[]>(),
  ]);
  const blad = lokale.error ?? quizy.error ?? trwajace.error;

  return (
    <main>
      <h1>Panel</h1>
      {blad ? (
        <p className="blad">Brak połączenia z bazą: {blad.message || blad.code || "nieznany błąd"}</p>
      ) : (
        <>
          <p>
            <Link href="/admin/gry/nowa" className="przycisk zloty">
              ▶ Uruchom quiz
            </Link>
          </p>
          <section className="panel-sekcja">
            <h2>Trwające rozgrywki</h2>
            <ListaGier gry={trwajace.data ?? []} pusta="Żadna rozgrywka teraz nie trwa." />
          </section>
          <p className="pomocniczy panel-sekcja">
            <Link href="/admin/quizy">Quizy: {quizy.count}</Link> ·{" "}
            <Link href="/admin/lokale">Lokale (ustawienia): {lokale.count}</Link>
          </p>
        </>
      )}
    </main>
  );
}
