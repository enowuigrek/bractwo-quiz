import { usunGrafike } from "@/lib/grafiki";
import { zKolorem } from "@/lib/kapsel";
import { supabaseAdmin } from "@/lib/supabase/serwer";

// Selfie graczy. Przeglądarka nie ma klucza do magazynu, więc zapis i usuwanie idą przez serwer:
// gracz zmienia swoje zdjęcie tokenem z localStorage, prowadzący usuwa cudze kluczem pilota.

const BUCKET = "grafiki";
/** Telefon przycina i zmniejsza zdjęcie do 256×256 (ok. 20 KB); zapas na inne przeglądarki. */
const MAX_B = 400 * 1024;
const TYPY: Record<string, string> = { "image/jpeg": "jpg", "image/webp": "webp" };

function blad(tekst: string, status = 400) {
  return Response.json({ ok: false, blad: tekst }, { status });
}

type Gracz = { id: string; sesja_id: string; nick: string; zdjecie_url: string | null; sesje: { faza: string } | null };

async function graczPoTokenie(token: string): Promise<Gracz | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const { data } = await supabaseAdmin()
    .from("gracze")
    .select("id, sesja_id, nick, zdjecie_url, sesje(faza)")
    .eq("token", token)
    .maybeSingle<Gracz>();
  return data;
}

/** Nowe zdjęcie gracza: `token` i `plik` (JPEG albo WebP). */
export async function POST(request: Request) {
  const dane = await request.formData().catch(() => null);
  const token = String(dane?.get("token") ?? "");
  const plik = dane?.get("plik");
  if (!(plik instanceof File)) return blad("Brak zdjęcia.");
  if (!TYPY[plik.type]) return blad("Zdjęcie musi być w formacie JPEG albo WebP.");
  if (plik.size > MAX_B) return blad("Zdjęcie jest za duże.");

  const gracz = await graczPoTokenie(token);
  if (!gracz) return blad("Nieznany gracz.", 403);
  if (gracz.sesje?.faza === "koniec") return blad("Ta gra już się skończyła.", 409);

  // nowa nazwa przy każdej zmianie, żeby TV i telefony nie trzymały starego zdjęcia w pamięci podręcznej
  const sciezka = `gracze/${gracz.sesja_id}/${gracz.id}-${crypto.randomUUID()}.${TYPY[plik.type]}`;
  const storage = supabaseAdmin().storage.from(BUCKET);
  const { error: bladZapisu } = await storage.upload(sciezka, plik, { contentType: plik.type, cacheControl: "604800" });
  if (bladZapisu) return blad("Nie udało się zapisać zdjęcia.", 500);
  // kolor kapsla z telefonu w adresie (`#kapsel=rrggbb`, src/lib/kapsel.ts); zły kolor po prostu pomijamy
  const url = zKolorem(storage.getPublicUrl(sciezka).data.publicUrl, String(dane?.get("kapsel") ?? "") || null);

  const { error } = await supabaseAdmin().from("gracze").update({ zdjecie_url: url }).eq("id", gracz.id);
  if (error) {
    await usunGrafike(url);
    return blad("Nie udało się zapisać zdjęcia.", 500);
  }
  await usunGrafike(gracz.zdjecie_url);
  return Response.json({ ok: true, zdjecie: url });
}

/**
 * Usunięcie zdjęcia: gracz swoje (`{ token }`) albo prowadzący dowolnego gracza
 * (`{ kod, host_token, nick }`), np. gdy zdjęcie nie nadaje się na TV.
 */
export async function DELETE(request: Request) {
  const dane = (await request.json().catch(() => null)) as
    | { token?: string; kod?: string; host_token?: string; nick?: string }
    | null;
  const db = supabaseAdmin();

  let gracz: Pick<Gracz, "id" | "zdjecie_url"> | null = null;
  if (dane?.token) {
    gracz = await graczPoTokenie(dane.token);
  } else if (dane?.kod && dane.host_token && dane.nick) {
    const { data: sesja } = await db
      .from("sesje")
      .select("id")
      .eq("kod", dane.kod.toUpperCase())
      .eq("host_token", dane.host_token)
      .neq("faza", "koniec")
      .maybeSingle();
    if (!sesja) return blad("Brak dostępu do pilota.", 403);
    const { data } = await db
      .from("gracze")
      .select("id, zdjecie_url")
      .eq("sesja_id", sesja.id)
      .eq("nick", dane.nick)
      .maybeSingle();
    gracz = data;
  }
  if (!gracz) return blad("Nie ma takiego gracza.", 404);

  const { error } = await db.from("gracze").update({ zdjecie_url: null }).eq("id", gracz.id);
  if (error) return blad("Nie udało się usunąć zdjęcia.", 500);
  await usunGrafike(gracz.zdjecie_url);
  return Response.json({ ok: true });
}
