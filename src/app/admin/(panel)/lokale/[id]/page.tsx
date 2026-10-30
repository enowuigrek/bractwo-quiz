/* eslint-disable @next/next/no-img-element -- logo lokalu z bucketu Supabase */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { widziWszystko, wymagajAdmina, lokalRoli } from "@/lib/admin";
import { filtrGier, filtrQuizow, wymagajLokalu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { ZnaczekOsoby, type Osoba } from "../../_komponenty/lokale-autorzy";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "../../gry/lista-gier";

export const metadata: Metadata = { title: "Lokal · Bractwo Quiz" };

const data = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });

/** Najczęstsza wartość z listy (np. quiz albo prowadzący) z liczbą wystąpień. */
function najczesciej(wartosci: (string | null | undefined)[]): { nazwa: string; ile: number } | null {
  const licznik = new Map<string, number>();
  for (const w of wartosci) if (w) licznik.set(w, (licznik.get(w) ?? 0) + 1);
  const [nazwa, ile] = [...licznik].sort((a, b) => b[1] - a[1])[0] ?? [];
  return nazwa ? { nazwa, ile: ile! } : null;
}

/**
 * Lokal do oglądania (30.10, Łukasz): liczby, osoby z dostępem (z profilami), rozgrywki i quizy lokalu. Ustawienia
 * (logo, ekran, osoby, hasła) są pod „Edytuj” (`edycja/`). Lokal widzi tylko swoją stronę (`wymagajLokalu`).
 */
export default async function StronaLokalu({ params }: PageProps<"/admin/lokale/[id]">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  wymagajLokalu(rola, id);
  const db = supabaseAdmin();
  const [{ data: lokal }, { data: osoby }, { data: gryZBazy }, { data: quizy }] = await Promise.all([
    db.from("lokale").select("id, nazwa, miasto, logo_url, adres_ekranu, instagram").eq("id", id).maybeSingle<Lokal>(),
    db
      .from("konta_role")
      .select("konta(id, nazwa, zdjecie_url, zablokowane)")
      .eq("rola", "lokal")
      .eq("lokal_id", id)
      .returns<{ konta: (Osoba & { id: string; zablokowane: boolean }) | null }[]>(),
    filtrGier(db.from("sesje").select(ZAPYTANIE_GIER).eq("lokal_id", id), rola, true)
      .order("utworzono", { ascending: false })
      .returns<GraNaLiscie[]>(),
    filtrQuizow(db.from("quizy").select("id, tytul").eq("lokal_id", id), rola)
      .is("usunieto", null)
      .order("tytul")
      .returns<{ id: string; tytul: string }[]>(),
  ]);
  if (!lokal) notFound();
  const gry = gryZBazy ?? [];
  const { count: graczy } = gry.length
    ? await db
        .from("gracze")
        .select("id", { count: "exact", head: true })
        .in(
          "sesja_id",
          gry.map((g) => g.id),
        )
        .eq("bot", false)
    : { count: 0 };
  const ludzie = (osoby ?? []).flatMap((o) => (o.konta && !o.konta.zablokowane ? [o.konta] : []));
  const ostatnia = gry.map((g) => g.wystartowano ?? g.planowany_start ?? g.utworzono).sort().at(-1);
  const quiz = najczesciej(gry.map((g) => g.quizy?.tytul));
  const prowadzi = najczesciej(gry.map((g) => g.konta?.nazwa));
  const mozeEdytowac = widziWszystko(rola) || lokalRoli(rola) === id;

  const dane: [string, string | null][] = [
    ["Miasto", lokal.miasto],
    ["Rozgrywki", gry.length ? String(gry.length) : "jeszcze żadnej"],
    ["Gracze", graczy ? `${graczy}${gry.length > 1 ? `, średnio ${Math.round(graczy / gry.length)} na grę` : ""}` : null],
    ["Ostatnia gra", ostatnia ? data.format(new Date(ostatnia)) : null],
    ["Najczęściej grany", quiz && gry.length > 1 ? `${quiz.nazwa} (${quiz.ile}×)` : null],
    ["Najczęściej prowadzi", prowadzi && gry.length > 1 ? `${prowadzi.nazwa} (${prowadzi.ile}×)` : null],
    ["Ekran", `/ekran/${lokal.adres_ekranu}`],
    ["Instagram", lokal.instagram ? `@${lokal.instagram}` : null],
  ];

  return (
    <main>
      {widziWszystko(rola) && (
        <p className="okruchy">
          <Link href="/admin/lokale">← Lokale</Link>
        </p>
      )}
      <div className="naglowek-strony">
        <div className="profil-naglowek">
          {lokal.logo_url ? (
            <img src={lokal.logo_url} alt="" className="profil-logo" />
          ) : (
            <span className="profil-logo profil-logo-litera" aria-hidden>
              {lokal.nazwa.slice(0, 1)}
            </span>
          )}
          <h1>{lokal.nazwa}</h1>
        </div>
        {mozeEdytowac && (
          <Link href={`/admin/lokale/${lokal.id}/edycja`} className="przycisk-maly">
            Edytuj
          </Link>
        )}
      </div>

      <dl className="dane-gry">
        {dane
          .filter(([, w]) => w)
          .map(([nazwa, wartosc]) => (
            <div key={nazwa}>
              <dt>{nazwa}</dt>
              <dd>{wartosc}</dd>
            </div>
          ))}
      </dl>

      <section className="panel-sekcja">
        <h2 className="naglowek-z-licznikiem">
          Osoby <span className="licznik">{ludzie.length}</span>
        </h2>
        {ludzie.length ? (
          <ul className="osoby">
            {ludzie.map((k) => (
              <li key={k.id}>
                <Link href={`/admin/osoby/${k.id}`} className="osoba">
                  <ZnaczekOsoby osoba={k} duzy />
                  <span>{k.nazwa}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lista-pusta">Nikt nie ma jeszcze dostępu do panelu lokalu.</p>
        )}
      </section>

      <section className="panel-sekcja">
        <h2 className="naglowek-z-licznikiem">
          Rozgrywki <span className="licznik">{gry.length}</span>
        </h2>
        <ListaGier gry={gry} pusta="W tym lokalu nie było jeszcze gry." lokal={!!lokalRoli(rola)} />
      </section>

      {!!quizy?.length && (
        <section className="panel-sekcja">
          <h2 className="naglowek-z-licznikiem">
            Quizy lokalu <span className="licznik">{quizy.length}</span>
          </h2>
          <ul className="lista">
            {quizy.map((q) => (
              <li key={q.id}>
                <div className="lista-glowna">
                  <div className="lista-tytul">
                    <Link href={`/admin/quizy/${q.id}/statystyki`}>{q.tytul}</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
