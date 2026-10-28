/* eslint-disable @next/next/no-img-element -- logo lokalu z bucketu Supabase albo z /public */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LogoQuiz } from "@/components/logo-quiz";
import { lokalRoli, rolaAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { zalogujLokal } from "../akcje";
import { FormularzLogowania } from "../logowanie/formularz";

type LokalLogowania = { id: string; nazwa: string; logo_url: string | null };

async function lokalZAdresu(adres: string): Promise<LokalLogowania | null> {
  const { data } = await supabaseAdmin()
    .from("lokale")
    .select("id, nazwa, logo_url")
    .eq("adres_ekranu", adres)
    .maybeSingle<LokalLogowania>();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/admin/[lokal]">): Promise<Metadata> {
  const lokal = await lokalZAdresu((await params).lokal);
  return { title: `${lokal?.nazwa ?? "Panel"} · Bractwo Quiz` };
}

/**
 * Logowanie lokalu (26.10): ten sam adres co ekran lokalu, tylko pod `/admin/` (np. `/admin/ppr`). Logo lokalu
 * i jego hasło; zalogowany lokal od razu trafia do swojego panelu.
 */
export default async function LogowanieLokalu({ params }: PageProps<"/admin/[lokal]">) {
  const lokal = await lokalZAdresu((await params).lokal);
  if (!lokal) notFound();
  const rola = await rolaAdmina();
  if (rola && lokalRoli(rola) === lokal.id) redirect("/admin");

  return (
    <div className="logowanie-ekran">
      <main className="kolumna">
        <h1 className="logowanie-lokalu">
          {lokal.logo_url ? <img src={lokal.logo_url} alt={lokal.nazwa} /> : <span>{lokal.nazwa}</span>}
          <LogoQuiz wysokosc={56} dopisek="panel" priorytet />
        </h1>
        <FormularzLogowania akcja={zalogujLokal.bind(null, lokal.id)} etykieta={`Hasło lokalu ${lokal.nazwa}`} />
      </main>
    </div>
  );
}
