import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajTworcy } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { ustawBlokade, usunKonto } from "../akcje";
import { FormularzKonta, NowyLink, type KontoDoEdycji, type LokalDoWyboru } from "../formularz";

export const metadata: Metadata = { title: "Konto · Bractwo Quiz" };

/** Konto osoby (tylko twórca): imię, e-mail, dostęp, link do hasła, blokada i usunięcie. */
export default async function Konto({ params }: PageProps<"/admin/konta/[id]">) {
  const tworca = await wymagajTworcy();
  const { id } = await params;
  const db = supabaseAdmin();
  const [{ data: konto }, { data: lokale }] = await Promise.all([
    db
      .from("konta")
      .select("id, nazwa, email, skrot, zablokowane, konta_role(rola, lokal_id)")
      .eq("id", id)
      .maybeSingle<
        Omit<KontoDoEdycji, "role"> & {
          skrot: string | null;
          zablokowane: boolean;
          konta_role: KontoDoEdycji["role"];
        }
      >(),
    db.from("lokale").select("id, nazwa, logo_url, testowy").order("nazwa").returns<LokalDoWyboru[]>(),
  ]);
  if (!konto) notFound();
  const ja = konto.id === tworca.konto.id;

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/konta">← Konta</Link>
      </p>
      <div className="naglowek-strony">
        <h1>{konto.nazwa}</h1>
        <Link href={`/admin/osoby/${konto.id}`} className="przycisk-maly">
          Profil
        </Link>
      </div>
      {konto.zablokowane && <p className="blad">Konto zablokowane: nie wejdzie do panelu.</p>}
      <div className="uklad-dwa">
        <section className="karta">
          <FormularzKonta
            konto={{ id: konto.id, nazwa: konto.nazwa, email: konto.email, role: konto.konta_role }}
            lokale={lokale ?? []}
          />
        </section>
        <section className="karta">
          <h2>Hasło</h2>
          <p className="pomocniczy">{konto.skrot ? "Ustawione." : "Jeszcze nie ustawione."}</p>
          <NowyLink kontoId={konto.id} />
        </section>
      </div>
      {!ja && (
        <section className="panel-sekcja przyciski">
          <form action={ustawBlokade.bind(null, konto.id, !konto.zablokowane)}>
            <button type="submit" className="przycisk">
              {konto.zablokowane ? "Odblokuj" : "Zablokuj"}
            </button>
          </form>
          <PrzyciskPotwierdz
            akcja={usunKonto.bind(null, konto.id)}
            pytanie={`Usunąć konto „${konto.nazwa}”? Gry i quizy zostaną, tylko bez autora.`}
            className="przycisk niebezpieczny"
          >
            Usuń konto
          </PrzyciskPotwierdz>
        </section>
      )}
    </main>
  );
}
