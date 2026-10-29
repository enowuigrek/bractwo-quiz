import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { wymagajGry } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { LITERY, liczbaCzesci, opisOdpowiedzi, opisRozwiazania, ulamek } from "@/lib/zadania";
import { sekundy } from "@/lib/czas";
import { wynikiGry, zadaniaGry, type OdpowiedzGracza } from "../../../wyniki";

export const metadata: Metadata = { title: "Gracz · Bractwo Quiz" };

/** Historia gracza w grze: pytanie po pytaniu, co odpowiedział, w jakim czasie i za ile punktów. */
export default async function HistoriaGracza({ params }: PageProps<"/admin/gry/[id]/gracze/[gracz]">) {
  const rola = await wymagajAdmina();
  const { id, gracz: graczId } = await params;
  await wymagajGry(rola, id, true);
  const db = supabaseAdmin();

  const { data: gra } = await db
    .from("sesje")
    .select("id, kod, quiz_id, zadanie_nr, tryb, quizy(tytul)")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      kod: string;
      quiz_id: string;
      zadanie_nr: number;
      tryb: string;
      quizy: { tytul: string } | null;
    }>();
  if (!gra) notFound();

  const [wyniki, zadania, { data: odpowiedzi }] = await Promise.all([
    wynikiGry(db, gra.id),
    zadaniaGry(db, gra.quiz_id, gra.zadanie_nr),
    db
      .from("odpowiedzi")
      .select("gracz_id, zadanie_id, dane, czas_ms, poprawna, punkty, ocena")
      .eq("sesja_id", gra.id)
      .eq("gracz_id", graczId)
      .returns<OdpowiedzGracza[]>(),
  ]);
  const i = wyniki.findIndex((w) => w.id === graczId);
  if (i < 0) notFound();
  const ja = wyniki[i];
  const poprzedni = wyniki[i - 1];
  const nastepny = wyniki[i + 1];

  return (
    <main>
      <p className="okruchy">
        <Link href={`/admin/gry/${gra.id}`}>
          ← Gra {gra.kod} · {gra.quizy?.tytul ?? "quiz usunięty"}
        </Link>
      </p>
      <h1 style={{ marginBottom: 4 }}>{ja.nick}</h1>
      <p className="pomocniczy" style={{ marginTop: 0 }}>
        {ja.miejsce}. miejsce z {wyniki.length} · {ja.punkty.toLocaleString("pl-PL")} pkt · dobrze {ja.dobre}/
        {zadania.length}
        {ja.sredniCzasMs !== null && ` · średni czas ${sekundy(ja.sredniCzasMs)}`}
      </p>

      <section className="panel-sekcja">
        {zadania.length === 0 ? (
          <p className="lista-pusta">W tej grze nie padło żadne pytanie.</p>
        ) : (
          <ol className="lista historia">
            {zadania.map((z, n) => {
              const o = (odpowiedzi ?? []).find((x) => x.zadanie_id === z.id);
              const idx = z.typ === "wybor" ? o?.dane.odpowiedz : undefined;
              const stan = !o ? "brak" : o.poprawna ? "dobrze" : "zle";
              const czesciowo = o && !o.poprawna && (o.ocena ?? 0) > 0;
              return (
                // blisko (szacowanie) albo częściowo dobrze: żółte, nie czerwone (28.10)
                <li key={z.id} className={`historia-${czesciowo ? "czesciowo" : stan}`}>
                  <span className="krok-nr historia-nr">{n + 1}.</span>
                  <div className="lista-glowna">
                    <div className="lista-tytul">{z.tresc}</div>
                    <div className="historia-odp">
                      {o && idx !== undefined && z.typ === "wybor" ? (
                        <>
                          <span className="historia-litera">{LITERY[idx]}</span>
                          <span>{z.dane.odpowiedzi[idx] ?? "odpowiedź usunięta z pytania"}</span>
                          <span className="historia-czas">{sekundy(o.czas_ms)}</span>
                        </>
                      ) : o ? (
                        <>
                          <span>
                            {opisOdpowiedzi(z, o.dane)}
                            {czesciowo &&
                              (z.typ === "szacowanie"
                                ? ` (blisko: ${Math.round((o.ocena ?? 0) * 100)}% punktów)`
                                : ` (częściowo: ${ulamek(o.ocena ?? 0, liczbaCzesci(z.typ, z.dane))})`)}
                          </span>
                          <span className="historia-czas">{sekundy(o.czas_ms)}</span>
                        </>
                      ) : (
                        <span className="pomocniczy">Brak odpowiedzi</span>
                      )}
                    </div>
                    {stan !== "dobrze" && <div className="lista-opis">{opisRozwiazania(z)}</div>}
                  </div>
                  <span className="historia-punkty">{o ? (o.punkty > 0 ? `+${o.punkty}` : "0") : "–"}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {(poprzedni || nastepny) && (
        <nav className="panel-sekcja historia-nawigacja" aria-label="Inni gracze">
          {poprzedni ? (
            <Link href={`/admin/gry/${gra.id}/gracze/${poprzedni.id}`} className="przycisk-maly">
              ← {poprzedni.miejsce}. {poprzedni.nick}
            </Link>
          ) : (
            <span />
          )}
          {nastepny && (
            <Link href={`/admin/gry/${gra.id}/gracze/${nastepny.id}`} className="przycisk-maly">
              {nastepny.miejsce}. {nastepny.nick} →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
