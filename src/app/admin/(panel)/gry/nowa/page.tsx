import type { Metadata } from "next";
import Link from "next/link";
import { lokalRoli, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { filtrLokaliRoli, filtrQuizow } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { Kreator } from "./kreator";

export const metadata: Metadata = { title: "Uruchom quiz · Bractwo Quiz" };

export default async function NowaGra() {
  const rola = await wymagajAdmina();
  const db = supabaseAdmin();
  // lokal uruchamia gry tylko u siebie (kreator pomija wtedy miasto i lokal)
  const lokalId = lokalRoli(rola);
  const zapytanieLokali = filtrLokaliRoli(db.from("lokale").select("id, nazwa, miasto, logo_url"), rola);
  const [{ data: lokale }, { data: quizy }] = await Promise.all([
    (lokalId ? zapytanieLokali.eq("id", lokalId) : zapytanieLokali).order("nazwa").returns<Lokal[]>(),
    filtrQuizow(db.from("quizy").select("id, tytul, tagi, zadania(typ, etap_id), etapy(id, finalowy, seria)"), rola)
      .is("usunieto", null)
      .order("utworzono", { ascending: false })
      .returns<
        {
          id: string;
          tytul: string;
          tagi: string[];
          zadania: { typ: string; etap_id: string | null }[];
          etapy: { id: string; finalowy: boolean; seria: boolean }[];
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
            // pytania, które zobaczy każdy: bez ciekawostek i bez puli finału serią (29.10: „66 pytań” liczyło pulę)
            pytania: q.zadania.filter(
              (z) => z.typ !== "ciekawostka" && !q.etapy.some((e) => e.id === z.etap_id && e.seria),
            ).length,
            final: q.etapy.some((e) => e.seria),
            tagi: q.tagi,
            rodzaj: q.etapy.length ? "wyscig" : "klasyczny",
            pijany: q.etapy.some((e) => e.finalowy && e.seria),
          }))}
        />
      </section>
    </main>
  );
}
