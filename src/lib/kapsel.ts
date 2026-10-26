// Kapsel koronowy jako SVG w dowolnym kolorze (awatary, 26.10). Kolor kapsla wybiera gracz przy dołączaniu (albo
// telefon dobiera go ze zdjęcia) i zapisuje w `gracze.zdjecie_url` jako fragment `#kapsel=rrggbb`: za adresem selfie
// albo sam (gracz bez zdjęcia). Fragment nie trafia do magazynu, a wszystkie stany gry i tak wydają `zdjecie`, więc
// kolor dociera wszędzie bez nowej kolumny. Prawdziwy adres obrazka daje `adresZdjecia`. Bez koloru: przy zdjęciu
// złoty, bez zdjęcia kolor po nicku.

export const ZLOTY_KAPSEL = "e3ac3f";
/** Grubość brzegu kapsla jako część średnicy: tyle zostaje na ząbki dookoła zdjęcia. */
export const BRZEG_KAPSLA = 0.12;

// Kolory kapsli bez zdjęcia: jasne kolory z design systemu (litera jest ciemna, więc nic ciemnego), po nicku.
const KOLORY = ["e3ac3f", "8fb63a", "c8711d", "f3d27a", "c9ced3", "e2735a", "7fb6e6", "5fc8c0"];

/** Kolory kapsli do wyboru przy dołączaniu (jasne, bo litera na kapslu jest ciemna). */
export const KOLORY_KAPSLI = ["e3ac3f", "c9ced3", "e2735a", "c8711d", "8fb63a", "5fc8c0", "7fb6e6", "b48ae6"] as const;

/** Kolor kapsla gracza bez zdjęcia, zawsze ten sam dla nicku. */
export function kolorNicku(nick: string): string {
  let h = 0;
  for (const z of nick) h = (h * 31 + z.codePointAt(0)!) | 0;
  return KOLORY[Math.abs(h) % KOLORY.length];
}
const ZABKI = 21;

/** Obrys kapsla (viewBox 0 0 100 100): 21 zaokrąglonych ząbków. Liczony raz (też do <canvas>, grafika-wyniku.ts). */
export const OBRYS_KAPSLA = (() => {
  const K = ZABKI * 8;
  const p: string[] = [];
  for (let k = 0; k < K; k++) {
    const t = (2 * Math.PI * k) / K;
    const r = 50 - 4.2 * (1 - ((Math.cos(ZABKI * t) + 1) / 2) ** 0.6);
    p.push(`${(50 + r * Math.cos(t)).toFixed(1)},${(50 + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${p.join("L")}Z`;
})();

/** Kolor przesunięty w stronę bieli (`o` > 0) albo czerni (`o` < 0). */
export function przesun(hex: string, o: number): string {
  const n = parseInt(hex, 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(o > 0 ? v + (255 - v) * o : v * (1 + o)));
  return c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** SVG kapsla w kolorze `hex` (bez #): metaliczny gradient z cieniem przy brzegu i jasnym pierścieniem. */
export function svgKapsla(hex: string): string {
  const jasny = przesun(hex, 0.5);
  const ciemny = przesun(hex, -0.45);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    `<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${jasny}"/>` +
    `<stop offset=".45" stop-color="#${hex}"/><stop offset="1" stop-color="#${ciemny}"/></linearGradient>` +
    `<radialGradient id="c"><stop offset=".78" stop-opacity="0"/><stop offset=".9" stop-opacity=".35"/>` +
    `<stop offset="1" stop-opacity="0"/></radialGradient></defs>` +
    `<path d="${OBRYS_KAPSLA}" fill="url(#m)"/><path d="${OBRYS_KAPSLA}" fill="url(#c)"/>` +
    `<circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.2"/></svg>`
  );
}

const adresy = new Map<string, string>();

/** `url("data:…")` kapsla do CSS, zapamiętany dla koloru. */
export function tloKapsla(hex: string): string {
  let a = adresy.get(hex);
  if (!a) {
    a = `url("data:image/svg+xml,${encodeURIComponent(svgKapsla(hex))}")`;
    adresy.set(hex, a);
  }
  return a;
}

/** Kolor kapsla zapisany w adresie selfie (`#kapsel=rrggbb`) albo null. */
export function kolorZAdresu(url: string | null | undefined): string | null {
  const m = url ? /#kapsel=([0-9a-f]{6})$/i.exec(url) : null;
  return m ? m[1].toLowerCase() : null;
}

/**
 * Wartość `zdjecie_url` ze zdjęciem (może być puste: sam kolor) i kolorem kapsla (zastępuje poprzedni). Bez obu: null.
 */
export function zKolorem(url: string | null, hex: string | null): string | null {
  const bez = url?.split("#")[0] ?? "";
  if (hex && /^[0-9a-f]{6}$/i.test(hex)) return `${bez}#kapsel=${hex.toLowerCase()}`;
  return bez || null;
}

/** Prawdziwy adres obrazka z `zdjecie_url` albo null (gracz bez zdjęcia, z samym kolorem kapsla). */
export function adresZdjecia(url: string | null | undefined): string | null {
  const bez = url?.split("#")[0];
  return bez ? url! : null;
}

/**
 * Kolor kapsla ze zdjęcia (w przeglądarce, przy wysyłaniu selfie): średnia z najbardziej nasyconych pikseli,
 * rozjaśniona tak, żeby kapsel był wyraźny na czarnym tle. Szary obraz daje złoty kapsel.
 */
export async function kolorZeZdjecia(zdjecie: Blob): Promise<string> {
  try {
    const obraz = await createImageBitmap(zdjecie);
    const p = document.createElement("canvas");
    p.width = 24;
    p.height = 24;
    const ctx = p.getContext("2d");
    if (!ctx) return ZLOTY_KAPSEL;
    ctx.drawImage(obraz, 0, 0, 24, 24);
    const d = ctx.getImageData(0, 0, 24, 24).data;
    const piksele: { r: number; g: number; b: number; s: number }[] = [];
    for (let i = 0; i < d.length; i += 4) {
      const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      piksele.push({ r, g, b, s: mx ? (mx - mn) / mx : 0 });
    }
    piksele.sort((a, b) => b.s - a.s);
    const wybrane = piksele.slice(0, Math.ceil(piksele.length / 5));
    if ((wybrane[0]?.s ?? 0) < 0.2) return ZLOTY_KAPSEL;
    const sr = (k: "r" | "g" | "b") => wybrane.reduce((s, x) => s + x[k], 0) / wybrane.length;
    let [r, g, b] = [sr("r"), sr("g"), sr("b")];
    // jasność co najmniej ok. 60%, żeby kapsel nie zlewał się z tłem
    const mx = Math.max(r, g, b, 1);
    const skala = Math.max(1, 160 / mx);
    [r, g, b] = [r, g, b].map((v) => Math.min(255, v * skala));
    return [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  } catch {
    return ZLOTY_KAPSEL;
  }
}
