/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IkonaKorona } from "@/components/ikony";
import { jestTworca, lokalRoli, ukryteLokale, wymagajAdmina } from "@/lib/admin";
import { filtrGier, filtrQuizow, wymagajOsoby } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { Podpis, ZnaczekOsoby } from "../../_komponenty/lokale-autorzy";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "../../gry/lista-gier";

export const metadata: Metadata = { title: "Osoba · Bractwo Quiz" };

const data = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });

type KontoProfilu = {
  id: string;
  nazwa: string;
  zdjecie_url: string | null;
  utworzono: string;
  ostatnie_logowanie: string | null;
  konta_role: { rola: "tworca" | "bractwo" | "lokal"; lokale: { id: string; nazwa: string; logo_url: string | null } | null }[];
};

/**
 * Profil osoby (30.10, Łukasz): duże zdjęcie, role, od kiedy jest, quizy, które założyła, i gry, które uruchomiła.
 * Twórca i Bractwo widzą wszystkich, lokal tylko swoich ludzi (`wymagajOsoby`). Ostatnie logowanie widzi tylko twórca,
 * e-maili nie ma (są na stronie „Konta”).
 */
export default async function ProfilOsoby({ params }: PageProps<"/admin/osoby/[id]">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  await wymagajOsoby(rola, id);
  const db = supabaseAdmin();
  const [{ data: konto }, { data: quizy }, { data: gryZBazy }] = await Promise.all([
    db
      .from("konta")
      .select("id, nazwa, zdjecie_url, utworzono, ostatnie_logowanie, konta_role(rola, lokale(id, nazwa, logo_url))")
      .eq("id", id)
      .maybeSingle<KontoProfilu>(),
    filtrQuizow(db.from("quizy").select("id, tytul").eq("autor_konto_id", id), rola)
      .is("usunieto", null)
      .order("utworzono", { ascending: false })
      .returns<{ id: string; tytul: string }[]>(),
    filtrGier(db.from("sesje").select(ZAPYTANIE_GIER).eq("autor_konto_id", id), rola, true)
      .order("utworzono", { ascending: false })
      .returns<GraNaLiscie[]>(),
  ]);
  if (!konto) notFound();
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

  const tworca = konto.konta_role.some((r) => r.rola === "tworca");
  const bractwo = konto.konta_role.some((r) => r.rola === "bractwo");
  // lokale osoby, bez testowego u tych, którzy go nie widzą
  const lokaleOsoby = konto.konta_role
    .flatMap((r) => (r.rola === "lokal" && r.lokale ? [r.lokale] : []))
    .filter((l) => !ukryteLokale(rola).includes(l.id));
  const lokaleGier = [...new Set(gry.map((g) => g.lokale?.nazwa).filter((n): n is string => !!n))];
  const licznikLokali = new Map<string, number>();
  for (const g of gry) if (g.lokale?.nazwa) licznikLokali.set(g.lokale.nazwa, (licznikLokali.get(g.lokale.nazwa) ?? 0) + 1);
  const ulubiony = [...licznikLokali].sort((a, b) => b[1] - a[1])[0];
  const ostatnia = gry.map((g) => g.wystartowano ?? g.planowany_start ?? g.utworzono).sort().at(-1);

  const dane: [string, string | null][] = [
    ["W aplikacji od", data.format(new Date(konto.utworzono))],
    ["Poprowadzone gry", gry.length ? String(gry.length) : "jeszcze żadnej"],
    ["Gracze", graczy ? `${graczy}${gry.length > 1 ? `, średnio ${Math.round(graczy / gry.length)} na grę` : ""}` : null],
    ["Lokale gier", lokaleGier.length ? lokaleGier.join(", ") : null],
    ["Najczęściej prowadzi w", ulubiony && gry.length > 1 ? `${ulubiony[0]} (${ulubiony[1]}×)` : null],
    ["Ostatnia gra", ostatnia ? data.format(new Date(ostatnia)) : null],
    ["Quizy", quizy?.length ? String(quizy.length) : null],
    // ostatnie logowanie tylko dla twórcy (30.10)
    ["Ostatnio w panelu", jestTworca(rola) && konto.ostatnie_logowanie ? data.format(new Date(konto.ostatnie_logowanie)) : null],
  ];

  return (
    <main>
      <div className="naglowek-strony">
        <div className="profil-naglowek">
          <ZnaczekOsoby osoba={konto} duzy />
          <div className="stos-ciasny">
            <h1>{konto.nazwa}</h1>
            {/* role ikonami: korona twórcy, logo Bractwa i lokali, z nazwą w dymku */}
            <p className="profil-role">
              {tworca && (
                <Podpis nazwa="Twórca">
                  <span className="panel-konto-korona">
                    <IkonaKorona />
                  </span>
                </Podpis>
              )}
              {bractwo && (
                <Podpis nazwa="Bractwo Piwne">
                  <img src="/loga/bractwo.svg" alt="" className="znaczek-lokalu logo-bractwo" />
                </Podpis>
              )}
              {lokaleOsoby.map((l) =>
                l.logo_url ? (
                  <Podpis key={l.id} nazwa={l.nazwa}>
                    <img src={l.logo_url} alt="" className="znaczek-lokalu" />
                  </Podpis>
                ) : (
                  <span key={l.id} className="lista-opis">
                    {l.nazwa}
                  </span>
                ),
              )}
            </p>
          </div>
        </div>
        {jestTworca(rola) && (
          <Link href={`/admin/konta/${konto.id}`} className="przycisk-maly">
            Konto i dostęp
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
          Poprowadzone gry <span className="licznik">{gry.length}</span>
        </h2>
        <ListaGier gry={gry} pusta="Bez poprowadzonych gier." lokal={!!lokalRoli(rola)} />
      </section>

      <section className="panel-sekcja">
        <h2 className="naglowek-z-licznikiem">
          Quizy <span className="licznik">{quizy?.length ?? 0}</span>
        </h2>
        {quizy?.length ? (
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
        ) : (
          <p className="lista-pusta">Bez quizów.</p>
        )}
      </section>
    </main>
  );
}
