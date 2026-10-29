import { usunGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";

// Usunięcie gracza przez prowadzącego (wyszedł albo nie gra). Kluczem jest klucz pilota.
// Odpowiedzi gracza znikają razem z nim (on delete cascade), więc najpierw jego wynik trafia do
// `gracze_usunieci` (historia gry w panelu, 28.10). Po usunięciu pilot woła `po_usunieciu_gracza`,
// które rozgłasza zmianę i w razie potrzeby kończy pytanie.

function blad(tekst: string, status = 400) {
  return Response.json({ ok: false, blad: tekst }, { status });
}

export async function DELETE(request: Request) {
  const dane = (await request.json().catch(() => null)) as { kod?: string; host_token?: string; nick?: string } | null;
  if (!dane?.kod || !dane.host_token || !dane.nick) return blad("Brak danych.");
  const db = supabaseAdmin();

  const { data: sesja } = await db
    .from("sesje")
    .select("id, zadanie_nr")
    .eq("kod", dane.kod.toUpperCase())
    .eq("host_token", dane.host_token)
    .neq("faza", "koniec")
    .maybeSingle();
  if (!sesja) return blad("Brak dostępu do pilota.", 403);

  const { data: gracz } = await db
    .from("gracze")
    .select("id, zdjecie_url")
    .eq("sesja_id", sesja.id)
    .eq("nick", dane.nick)
    .maybeSingle();
  if (!gracz) return blad("Nie ma takiego gracza.", 404);

  // wynik w chwili usunięcia: punkty, dobre odpowiedzi i miejsce wśród grających (po punktach)
  const [{ data: odpowiedzi }, { data: wszystkie }] = await Promise.all([
    db.from("odpowiedzi").select("punkty, poprawna").eq("gracz_id", gracz.id),
    db.from("odpowiedzi").select("gracz_id, punkty").eq("sesja_id", sesja.id),
  ]);
  const sumy = new Map<string, number>();
  for (const o of wszystkie ?? []) sumy.set(o.gracz_id, (sumy.get(o.gracz_id) ?? 0) + (o.punkty ?? 0));
  const moje = sumy.get(gracz.id) ?? 0;
  const { count: grajacych } = await db
    .from("gracze")
    .select("id", { count: "exact", head: true })
    .eq("sesja_id", sesja.id);
  const miejsce = grajacych ? 1 + [...sumy.entries()].filter(([id, p]) => id !== gracz.id && p > moje).length : null;
  await db.from("gracze_usunieci").insert({
    sesja_id: sesja.id,
    nick: dane.nick,
    zdjecie_url: gracz.zdjecie_url,
    punkty: (odpowiedzi ?? []).reduce((s, o) => s + (o.punkty ?? 0), 0),
    dobre: (odpowiedzi ?? []).filter((o) => o.poprawna).length,
    odpowiedzi: odpowiedzi?.length ?? 0,
    miejsce,
    zadanie_nr: sesja.zadanie_nr,
  });

  const { error } = await db.from("gracze").delete().eq("id", gracz.id);
  if (error) return blad("Nie udało się usunąć gracza.", 500);
  await usunGrafike(gracz.zdjecie_url);
  return Response.json({ ok: true });
}
