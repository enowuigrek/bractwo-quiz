import Link from "next/link";
import { lokalRoli, wymagajAdmina } from "@/lib/admin";
import { filtrGier, filtrQuizow } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "./gry/lista-gier";

export default async function Panel() {
  const rola = await wymagajAdmina();
  const lokalId = lokalRoli(rola);
  const db = supabaseAdmin();
  const [lokale, quizy, trwajace] = await Promise.all([
    // główny: liczba lokali; lokal: adres swojego ekranu
    lokalId
      ? db.from("lokale").select("id, adres_ekranu").eq("id", lokalId)
      : db.from("lokale").select("id, adres_ekranu", { count: "exact" }),
    filtrQuizow(db.from("quizy").select("*", { count: "exact", head: true }), rola).is("usunieto", null),
    filtrGier(db.from("sesje").select(ZAPYTANIE_GIER), rola, true)
      .neq("faza", "koniec")
      .order("utworzono", { ascending: false })
      .returns<GraNaLiscie[]>(),
  ]);
  const blad = lokale.error ?? quizy.error ?? trwajace.error;
  const mojEkran = lokalId ? (lokale.data?.[0]?.adres_ekranu as string | undefined) : undefined;

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
            <ListaGier gry={trwajace.data ?? []} pusta="Żadna rozgrywka teraz nie trwa." lokal={!!lokalId} />
          </section>
          <p className="pomocniczy panel-sekcja">
            <Link href="/admin/quizy">Quizy: {quizy.count}</Link> ·{" "}
            {lokalId ? (
              <>
                <Link href={`/admin/lokale/${lokalId}`}>Mój lokal (logo, hasło)</Link>
                {mojEkran && (
                  <>
                    {" "}
                    · <Link href={`/ekran/${mojEkran}`}>Ekran lokalu: /ekran/{mojEkran}</Link>
                  </>
                )}
              </>
            ) : (
              <Link href="/admin/lokale">Lokale (ustawienia): {lokale.count}</Link>
            )}
          </p>
        </>
      )}
    </main>
  );
}
