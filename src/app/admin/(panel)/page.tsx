import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "./gry/lista-gier";

export default async function Panel() {
  await wymagajAdmina();
  const db = supabaseAdmin();
  const [piwiarnie, quizy, trwajace] = await Promise.all([
    db.from("piwiarnie").select("*", { count: "exact", head: true }),
    db.from("quizy").select("*", { count: "exact", head: true }),
    db
      .from("sesje")
      .select(ZAPYTANIE_GIER)
      .neq("faza", "koniec")
      .order("utworzono", { ascending: false })
      .returns<GraNaLiscie[]>(),
  ]);
  const blad = piwiarnie.error ?? quizy.error ?? trwajace.error;

  return (
    <main>
      <h1>Panel</h1>
      {blad ? (
        <p className="blad">Brak połączenia z bazą: {blad.message || blad.code || "nieznany błąd"}</p>
      ) : (
        <>
          <p>
            <Link href="/admin/gry/nowa" className="przycisk zloty">
              Uruchom nową grę
            </Link>
          </p>
          <section className="panel-sekcja">
            <h2>Trwające gry</h2>
            <ListaGier gry={trwajace.data ?? []} pusta="Żadna gra teraz nie trwa." />
          </section>
          <p className="pomocniczy panel-sekcja">
            <Link href="/admin/quizy">Quizy: {quizy.count}</Link> ·{" "}
            <Link href="/admin/piwiarnie">Piwiarnie: {piwiarnie.count}</Link>
          </p>
        </>
      )}
    </main>
  );
}
