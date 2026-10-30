import type { Metadata } from "next";
import Link from "next/link";
import { wymagajTworcy } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FormularzKonta, type LokalDoWyboru } from "../formularz";

export const metadata: Metadata = { title: "Nowe konto · Bractwo Quiz" };

export default async function NoweKonto({ searchParams }: PageProps<"/admin/konta/nowe">) {
  await wymagajTworcy();
  const { lokal } = await searchParams;
  const { data: lokale } = await supabaseAdmin()
    .from("lokale")
    .select("id, nazwa, logo_url, testowy")
    .order("nazwa")
    .returns<LokalDoWyboru[]>();
  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/konta">← Konta</Link>
      </p>
      <h1>Nowe konto</h1>
      <section className="karta">
        <FormularzKonta lokale={lokale ?? []} lokalNaStart={typeof lokal === "string" ? lokal : null} />
      </section>
    </main>
  );
}
