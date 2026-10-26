import type { Metadata } from "next";
import Link from "next/link";
import { lokalRoli, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { filtrQuizow } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { Kreator } from "./kreator";

export const metadata: Metadata = { title: "Uruchom quiz · Bractwo Quiz" };

export default async function NowaGra() {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();
  // lokal uruchamia gry tylko u siebie (kreator pomija wtedy miasto i lokal)
  const lokalId = lokalRoli(rola);
  const zapytanieLokali = db.from("lokale").select("id, nazwa, miasto, logo_url");
  const [{ data: lokale }, { data: quizy }] = await Promise.all([
    (lokalId ? zapytanieLokali.eq("id", lokalId) : zapytanieLokali).order("nazwa").returns<Lokal[]>(),
    filtrQuizow(db.from("quizy").select("id, tytul, tagi, zadania(count), etapy(finalowy, seria)"), rola)
      .is("usunieto", null)
      .order("utworzono", { ascending: false })
      .returns<
        {
          id: string;
          tytul: string;
          tagi: string[];
          zadania: { count: number }[];
          etapy: { finalowy: boolean; seria: boolean }[];
        }[]
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
            tagi: q.tagi,
            rodzaj: q.etapy.length ? "wyscig" : "klasyczny",
            pijany: q.etapy.some((e) => e.finalowy && e.seria),
          }))}
        />
      </section>
    </main>
  );
}
