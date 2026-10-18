import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { usunLokal } from "../akcje";
import { FormularzLokalu } from "../formularz";

export const metadata: Metadata = { title: "Lokal · Bractwo Quiz" };

export default async function EdycjaLokalu({ params }: PageProps<"/admin/lokale/[id]">) {
  await wymagajAdmina();
  const { id } = await params;
  const db = supabaseAdmin();
  const [{ data: lokal }, { data: wszystkie }] = await Promise.all([
    db.from("lokale").select("id, nazwa, miasto, logo_url").eq("id", id).maybeSingle<Lokal>(),
    db.from("lokale").select("miasto"),
  ]);
  if (!lokal) notFound();

  const miasta = [...new Set((wszystkie ?? []).map((p) => p.miasto as string | null).filter((m): m is string => !!m))];

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/lokale">← Lokale</Link>
      </p>
      <h1>{lokal.nazwa}</h1>
      <section className="karta">
        <FormularzLokalu lokal={lokal} miasta={miasta} />
      </section>
      <section className="panel-sekcja">
        <PrzyciskPotwierdz
          akcja={usunLokal.bind(null, lokal.id)}
          pytanie={`Usunąć lokal „${lokal.nazwa}”? Rozegrane w nim gry zostaną, tylko bez lokalu.`}
        >
          Usuń lokal
        </PrzyciskPotwierdz>
      </section>
    </main>
  );
}
