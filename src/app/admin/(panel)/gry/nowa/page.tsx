import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Piwiarnia } from "@/lib/typy";
import { Kreator } from "./kreator";

export const metadata: Metadata = { title: "Nowa gra · Bractwo Quiz" };

export default async function NowaGra() {
  await wymagajAdmina();
  const db = supabaseAdmin();
  const [{ data: piwiarnie }, { data: quizy }] = await Promise.all([
    db.from("piwiarnie").select("id, nazwa, miasto, logo_url").order("nazwa").returns<Piwiarnia[]>(),
    db
      .from("quizy")
      .select("id, tytul, zadania(count)")
      .order("utworzono", { ascending: false })
      .returns<{ id: string; tytul: string; zadania: { count: number }[] }[]>(),
  ]);

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/gry">← Gry</Link>
      </p>
      <h1>Nowa gra</h1>
      <section className="karta">
        <Kreator
          piwiarnie={piwiarnie ?? []}
          quizy={(quizy ?? []).map((q) => ({ id: q.id, tytul: q.tytul, pytania: q.zadania[0]?.count ?? 0 }))}
        />
      </section>
    </main>
  );
}
