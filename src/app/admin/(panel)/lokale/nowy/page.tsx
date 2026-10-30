import type { Metadata } from "next";
import Link from "next/link";
import { wymagajTworcy } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FormularzLokalu } from "../formularz";

export const metadata: Metadata = { title: "Nowy lokal · Bractwo Quiz" };

export default async function NowyLokal() {
  await wymagajTworcy();
  const { data } = await supabaseAdmin().from("lokale").select("miasto");
  const miasta = [...new Set((data ?? []).map((p) => p.miasto as string | null).filter((m): m is string => !!m))];

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/lokale">← Lokale</Link>
      </p>
      <h1>Nowy lokal</h1>
      <section className="karta">
        <FormularzLokalu miasta={miasta} />
      </section>
    </main>
  );
}
