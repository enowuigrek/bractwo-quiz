import type { Metadata } from "next";
import Link from "next/link";
import { widziWszystko, wymagajAdmina } from "@/lib/admin";
import { widoczne } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { Kreator } from "./kreator";

export const metadata: Metadata = { title: "Uruchom quiz · Bractwo Quiz" };

export default async function NowaGra() {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();
  const [{ data: lokale }, { data: quizy }] = await Promise.all([
    db.from("lokale").select("id, nazwa, miasto, logo_url").order("nazwa").returns<Lokal[]>(),
    db
      .from("quizy")
      .select("id, tytul, zadania(count), etapy(finalowy, seria)")
      .in("tylko_glowny", widoczne(rola))
      .order("utworzono", { ascending: false })
      .returns<
        { id: string; tytul: string; zadania: { count: number }[]; etapy: { finalowy: boolean; seria: boolean }[] }[]
      >(),
  ]);

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/gry">← Rozgrywki</Link>
      </p>
      <h1>Uruchom quiz</h1>
      <section className="karta">
        <Kreator
          glowny={widziWszystko(rola)}
          lokale={lokale ?? []}
          quizy={(quizy ?? []).map((q) => ({
            id: q.id,
            tytul: q.tytul,
            pytania: q.zadania[0]?.count ?? 0,
            wyscig: q.etapy.some((e) => e.finalowy && e.seria),
          }))}
        />
      </section>
    </main>
  );
}
