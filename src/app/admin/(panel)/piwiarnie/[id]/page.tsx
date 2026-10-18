import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Piwiarnia } from "@/lib/typy";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { usunPiwiarnie } from "../akcje";
import { FormularzPiwiarni } from "../formularz";

export const metadata: Metadata = { title: "Lokal · Bractwo Quiz" };

export default async function EdycjaPiwiarni({ params }: PageProps<"/admin/piwiarnie/[id]">) {
  await wymagajAdmina();
  const { id } = await params;
  const db = supabaseAdmin();
  const [{ data: piwiarnia }, { data: wszystkie }] = await Promise.all([
    db.from("piwiarnie").select("id, nazwa, miasto, logo_url").eq("id", id).maybeSingle<Piwiarnia>(),
    db.from("piwiarnie").select("miasto"),
  ]);
  if (!piwiarnia) notFound();

  const miasta = [...new Set((wszystkie ?? []).map((p) => p.miasto as string | null).filter((m): m is string => !!m))];

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/piwiarnie">← Piwiarnie</Link>
      </p>
      <h1>{piwiarnia.nazwa}</h1>
      <section className="karta">
        <FormularzPiwiarni piwiarnia={piwiarnia} miasta={miasta} />
      </section>
      <section className="panel-sekcja">
        <PrzyciskPotwierdz
          akcja={usunPiwiarnie.bind(null, piwiarnia.id)}
          pytanie={`Usunąć lokal „${piwiarnia.nazwa}”? Rozegrane w nim gry zostaną, tylko bez lokalu.`}
        >
          Usuń lokal
        </PrzyciskPotwierdz>
      </section>
    </main>
  );
}
