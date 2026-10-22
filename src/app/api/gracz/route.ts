import { usunGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";

// Usunięcie gracza przez prowadzącego (wyszedł albo nie gra). Kluczem jest klucz pilota.
// Odpowiedzi gracza znikają razem z nim (on delete cascade). Po usunięciu pilot woła
// `po_usunieciu_gracza`, które rozgłasza zmianę i w razie potrzeby kończy pytanie.

function blad(tekst: string, status = 400) {
  return Response.json({ ok: false, blad: tekst }, { status });
}

export async function DELETE(request: Request) {
  const dane = (await request.json().catch(() => null)) as { kod?: string; host_token?: string; nick?: string } | null;
  if (!dane?.kod || !dane.host_token || !dane.nick) return blad("Brak danych.");
  const db = supabaseAdmin();

  const { data: sesja } = await db
    .from("sesje")
    .select("id")
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

  const { error } = await db.from("gracze").delete().eq("id", gracz.id);
  if (error) return blad("Nie udało się usunąć gracza.", 500);
  await usunGrafike(gracz.zdjecie_url);
  return Response.json({ ok: true });
}
