import { nastepnyKrok } from "@/lib/gra/auto";
import type { PilotStan } from "@/lib/gra/typy";
import { supabaseAdmin } from "@/lib/supabase/serwer";

// Automatyczne prowadzenie i boty od strony TV. Pilot robi to samo w przeglądarce (src/app/pilot/[kod]/auto.tsx,
// boty.tsx), ale karta pilota w tle (Safari, zablokowany telefon) budzi się raz na minutę i ranking stał wtedy
// nawet 2 minuty. TV jest zawsze na wierzchu, więc co chwilę woła tę trasę. Klucz pilota zna tylko serwer;
// trasa robi wyłącznie to, co zrobiłby automat, i tylko gdy prowadzący go włączył (`sesje.auto`). Krok idzie
// przez `auto_krok`, który przechodzi tylko z widzianej fazy, więc pilot i kilka ekranów naraz nie przeskoczą fazy.

export async function POST(request: Request) {
  const dane = (await request.json().catch(() => null)) as { kod?: string } | null;
  const kod = dane?.kod?.toUpperCase();
  if (!kod) return Response.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();

  const { data: sesja } = await db
    .from("sesje")
    .select("host_token, auto")
    .eq("kod", kod)
    .neq("faza", "koniec")
    .maybeSingle<{ host_token: string; auto: boolean }>();
  if (!sesja?.auto) return Response.json({ ok: true, krok: null });

  const { data, error } = await db.rpc("pilot_stan", { p_kod: kod, p_host_token: sesja.host_token });
  if (error || !data) return Response.json({ ok: false }, { status: 500 });
  const stan = data as PilotStan;

  // boty odpowiadają w pytaniu i w serii (baza losuje, które teraz)
  if (stan.boty && (stan.faza === "pytanie" || stan.faza === "seria")) {
    await db.rpc("boty_odpowiadaj", { p_kod: kod, p_host_token: sesja.host_token });
  }

  const krok = nastepnyKrok(stan, Date.now());
  if (krok) {
    await db.rpc("auto_krok", {
      p_kod: kod,
      p_host_token: sesja.host_token,
      p_faza_od: stan.faza_od,
      p_akcja: krok,
    });
  }
  return Response.json({ ok: true, krok });
}
