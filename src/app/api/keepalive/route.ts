import { createClient } from "@supabase/supabase-js";
import { usunGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";

/**
 * Raz dziennie woła go Vercel Cron (`vercel.json`), żeby darmowy projekt Supabase nie zasnął.
 * 1. Małe zapytanie do bazy.
 * 2. Podłączenie do Realtime: dopiero wtedy usługa zakłada partycje `realtime.messages`
 *    na kolejne dni, a bez nich `realtime.send` po cichu gubi zdarzenia (PLAN.md, ⚠️ z dnia 1).
 * 3. Sprzątanie: selfie graczy starsze niż 7 dni (dane osobowe), historia gry zostaje bez zdjęć.
 *
 * Vercel wysyła `Authorization: Bearer <CRON_SECRET>`, gdy zmienna jest ustawiona.
 */
export async function GET(request: Request) {
  const sekret = process.env.CRON_SECRET;
  if (sekret && request.headers.get("authorization") !== `Bearer ${sekret}`) {
    return Response.json({ ok: false, blad: "Brak dostępu" }, { status: 401 });
  }

  const start = Date.now();
  const { error: bladBazy } = await supabaseAdmin().from("lokale").select("id").limit(1);
  const realtime = await podlaczRealtime();
  const zdjecia = await usunStareZdjecia();

  const ok = !bladBazy && realtime === "SUBSCRIBED";
  return Response.json(
    { ok, baza: bladBazy ? bladBazy.message : "ok", realtime, zdjecia, ms: Date.now() - start },
    { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } },
  );
}

/** Podłącza się do kanału Realtime kluczem publicznym i od razu rozłącza. */
async function podlaczRealtime(): Promise<string> {
  const klient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const kanal = klient.channel("keepalive");
  try {
    return await new Promise<string>((gotowe) => {
      const zegar = setTimeout(() => gotowe("TIMED_OUT"), 10_000);
      kanal.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(zegar);
          gotowe(status);
        }
      });
    });
  } finally {
    await klient.removeAllChannels();
  }
}

/** Usuwa selfie graczy, którzy dołączyli ponad 7 dni temu. Zwraca liczbę usuniętych albo opis błędu. */
async function usunStareZdjecia(): Promise<number | string> {
  const granica = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("gracze")
    .select("id, zdjecie_url")
    .not("zdjecie_url", "is", null)
    .lt("dolaczyl", granica)
    .limit(500);
  if (error) return error.message;
  if (!data?.length) return 0;
  await Promise.all(data.map((g) => usunGrafike(g.zdjecie_url)));
  const { error: bladZmiany } = await db
    .from("gracze")
    .update({ zdjecie_url: null })
    .in(
      "id",
      data.map((g) => g.id),
    );
  return bladZmiany ? bladZmiany.message : data.length;
}
