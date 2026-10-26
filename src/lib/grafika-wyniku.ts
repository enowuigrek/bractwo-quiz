"use client";

// Grafiki do udostępnienia w social mediach, rysowane w przeglądarce na <canvas>:
// wynik gracza (relacja 1080×1920) i podium gry dla lokalu (post 1080×1350).
// Bez instrukcji odbioru nagród: zamiast nich loga Bractwa, lokalu i ewentualnie browaru.

export type LogoNaGrafice = { nazwa: string; logo_url: string | null } | null;

type Wspolne = {
  tytul: string;
  okazja: string | null;
  lokal: LogoNaGrafice;
  browar: LogoNaGrafice;
  /** Data gry, np. „23.10.2026”. */
  data: string;
  /** Konta do oznaczenia (z @), wypisane na dole grafiki. */
  oznaczenia?: string[];
};

export type DaneWyniku = Wspolne & {
  nick: string;
  zdjecie: string | null;
  miejsce: number;
  liczbaGraczy: number;
  punkty: number;
};

export type DanePodium = Wspolne & {
  podium: { nick: string; zdjecie: string | null; miejsce: number; punkty: number }[];
};

const ZLOTO = "#e3ac3f";
const PIANA = "#f4ecd8";
const SZARY = "#9aa3ad";
const METALE: Record<number, [string, string, string]> = {
  1: ["#fbe7a1", "#e3ac3f", "#8a5d10"],
  2: ["#f1f3f5", "#c5ccd3", "#6b747c"],
  3: ["#f3c49a", "#c9804a", "#6b3b16"],
};

/** Krój z aplikacji (Open Sans z next/font), żeby grafika wyglądała jak ekrany. */
function kroj(): string {
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

function wczytaj(src: string): Promise<HTMLImageElement> {
  return new Promise((gotowe, zle) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => gotowe(img);
    img.onerror = () => zle(new Error(`Nie wczytano ${src}`));
    img.src = src;
  });
}

/** Logo Bractwa jest czarne; na ciemną grafikę przemalowujemy je na biało. */
async function logoBractwa(): Promise<HTMLImageElement | null> {
  try {
    const svg = await (await fetch("/loga/bractwo.svg")).text();
    const biale = svg.replace("<g>", '<g fill="#fff">').replaceAll("stroke:#000", "stroke:#fff");
    return await wczytaj(URL.createObjectURL(new Blob([biale], { type: "image/svg+xml" })));
  } catch {
    return null;
  }
}

/** Obraz albo null, gdy się nie wczyta (np. brak CORS): grafika powstaje i bez niego. */
async function moze(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  try {
    return await wczytaj(src);
  } catch {
    return null;
  }
}

/** Obraz wpasowany w prostokąt z zachowaniem proporcji. */
function rysujWpasowany(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const skala = Math.min(w / img.width, h / img.height);
  const dw = img.width * skala;
  const dh = img.height * skala;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Rząd logo wyśrodkowany w poziomie: Bractwo, lokal, × browar. */
async function rysujLoga(ctx: CanvasRenderingContext2D, d: Wspolne, szer: number, y: number, wys: number) {
  const [bractwo, lokal, browar] = await Promise.all([
    logoBractwa(),
    moze(d.lokal?.logo_url),
    moze(d.browar?.logo_url),
  ]);
  const elementy: { img: HTMLImageElement | null; w: number; tekst?: string }[] = [];
  if (bractwo) elementy.push({ img: bractwo, w: wys * (bractwo.width / bractwo.height) });
  if (lokal) elementy.push({ img: lokal, w: wys });
  if (d.browar) {
    elementy.push({ img: null, w: wys * 0.3, tekst: "×" });
    elementy.push(browar ? { img: browar, w: wys } : { img: null, w: wys * 2, tekst: d.browar.nazwa });
  }
  const odstep = 44;
  const calosc = elementy.reduce((s, e) => s + e.w, 0) + odstep * (elementy.length - 1);
  let x = (szer - calosc) / 2;
  for (const e of elementy) {
    if (e.img) rysujWpasowany(ctx, e.img, x, y, e.w, wys);
    else if (e.tekst) {
      ctx.fillStyle = e.tekst === "×" ? SZARY : ZLOTO;
      ctx.font = `700 ${e.tekst === "×" ? 56 : 40}px ${kroj()}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(e.tekst, x + e.w / 2, y + wys / 2, e.w);
    }
    x += e.w + odstep;
  }
}

/** Kółko z selfie albo z pierwszą literą nicku, z obręczą w kolorze metalu. */
async function rysujAwatar(
  ctx: CanvasRenderingContext2D,
  d: { nick: string; zdjecie: string | null; miejsce: number },
  cx: number,
  cy: number,
  r: number,
) {
  const [jasny, metal, ciemny] = METALE[d.miejsce] ?? ["#3a4552", "#27313b", "#11161b"];
  const obrecz = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  obrecz.addColorStop(0, jasny);
  obrecz.addColorStop(0.5, metal);
  obrecz.addColorStop(1, ciemny);
  ctx.save();
  ctx.shadowColor = metal;
  ctx.shadowBlur = METALE[d.miejsce] ? 60 : 0;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = obrecz;
  ctx.fill();
  ctx.restore();

  const wew = r * 0.86;
  const zdjecie = await moze(d.zdjecie);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, wew, 0, Math.PI * 2);
  ctx.clip();
  if (zdjecie) {
    const bok = Math.min(zdjecie.width, zdjecie.height);
    ctx.drawImage(zdjecie, (zdjecie.width - bok) / 2, (zdjecie.height - bok) / 2, bok, bok, cx - wew, cy - wew, wew * 2, wew * 2);
  } else {
    ctx.fillStyle = "#1b222a";
    ctx.fillRect(cx - wew, cy - wew, wew * 2, wew * 2);
    ctx.fillStyle = PIANA;
    ctx.font = `800 ${wew}px ${kroj()}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.nick.slice(0, 1).toUpperCase(), cx, cy + wew * 0.05);
  }
  ctx.restore();

  // numer miejsca w kółku na dole obręczy
  const rn = r * 0.3;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.9, rn, 0, Math.PI * 2);
  ctx.fillStyle = metal;
  ctx.fill();
  ctx.fillStyle = METALE[d.miejsce] ? "#1a1100" : PIANA;
  ctx.font = `800 ${rn * 1.15}px ${kroj()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(d.miejsce), cx, cy + r * 0.9 + rn * 0.05);
}

function tlo(ctx: CanvasRenderingContext2D, szer: number, wys: number) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, szer, wys);
  const blask = ctx.createRadialGradient(szer / 2, wys * 0.45, 0, szer / 2, wys * 0.45, szer * 0.9);
  blask.addColorStop(0, "rgba(227, 172, 63, 0.28)");
  blask.addColorStop(1, "rgba(227, 172, 63, 0)");
  ctx.fillStyle = blask;
  ctx.fillRect(0, 0, szer, wys);
}

function tekst(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, rozmiar: number, kolor: string, waga = 800, maks?: number) {
  ctx.fillStyle = kolor;
  ctx.font = `${waga} ${rozmiar}px ${kroj()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(t, x, y, maks);
}

function naBlob(plotno: HTMLCanvasElement): Promise<Blob> {
  return new Promise((gotowe, zle) =>
    plotno.toBlob((b) => (b ? gotowe(b) : zle(new Error("Nie udało się zapisać grafiki."))), "image/png"),
  );
}

const TYTULY: Record<number, string> = { 1: "Zwycięstwo!", 2: "Srebro!", 3: "Brąz!" };

/** Wynik gracza jako relacja 1080×1920. */
export async function grafikaWyniku(d: DaneWyniku): Promise<Blob> {
  const S = 1080;
  const W = 1920;
  const plotno = document.createElement("canvas");
  plotno.width = S;
  plotno.height = W;
  const ctx = plotno.getContext("2d");
  if (!ctx) throw new Error("Ta przeglądarka nie umie narysować grafiki.");
  await document.fonts.ready;
  tlo(ctx, S, W);

  await rysujLoga(ctx, d, S, 150, 170);
  tekst(ctx, (d.okazja ?? "Quiz Bractwa Piwnego").toUpperCase(), S / 2, 450, 38, ZLOTO, 700, S - 120);
  tekst(ctx, d.tytul, S / 2, 520, 56, PIANA, 800, S - 120);

  await rysujAwatar(ctx, d, S / 2, 860, 230);

  const podium = d.miejsce <= 3;
  tekst(ctx, podium ? TYTULY[d.miejsce] : `${d.miejsce}. miejsce`, S / 2, 1270, 110, podium ? (METALE[d.miejsce]?.[1] ?? ZLOTO) : PIANA);
  tekst(ctx, d.nick, S / 2, 1380, 72, PIANA, 800, S - 120);
  tekst(
    ctx,
    `${d.miejsce}. miejsce z ${d.liczbaGraczy} · ${d.punkty.toLocaleString("pl-PL")} pkt`,
    S / 2,
    1460,
    42,
    SZARY,
    600,
  );

  if (d.oznaczenia?.length) tekst(ctx, d.oznaczenia.join("  "), S / 2, 1620, 34, SZARY, 600, S - 120);
  tekst(ctx, [d.lokal?.nazwa, d.data].filter(Boolean).join(" · "), S / 2, 1700, 36, PIANA, 600, S - 120);
  tekst(ctx, "Piwu Cześć!", S / 2, 1780, 44, ZLOTO, 800);
  return naBlob(plotno);
}

/**
 * Podium gry jako relacja 1080×1920 (dla lokalu, z panelu): ten sam układ co grafika gracza (26.10, Łukasz: wcześniej
 * post 1080×1350 wyglądał gorzej), tylko w środku trójka na stopniach podium.
 */
export async function grafikaPodium(d: DanePodium): Promise<Blob> {
  const S = 1080;
  const W = 1920;
  const plotno = document.createElement("canvas");
  plotno.width = S;
  plotno.height = W;
  const ctx = plotno.getContext("2d");
  if (!ctx) throw new Error("Ta przeglądarka nie umie narysować grafiki.");
  await document.fonts.ready;
  tlo(ctx, S, W);

  await rysujLoga(ctx, d, S, 150, 170);
  tekst(ctx, (d.okazja ?? "Quiz Bractwa Piwnego").toUpperCase(), S / 2, 450, 38, ZLOTO, 700, S - 120);
  tekst(ctx, d.tytul, S / 2, 520, 56, PIANA, 800, S - 120);

  // 2. z lewej, 1. w środku i najwyżej, 3. z prawej; pod awatarem nick i punkty, pod nimi stopień z numerem
  const DNO = 1500;
  const stopnie = [
    { i: 1, x: S * 0.2, wys: 230, r: 115 },
    { i: 0, x: S * 0.5, wys: 330, r: 150 },
    { i: 2, x: S * 0.8, wys: 170, r: 105 },
  ];
  const SZER_STOPNIA = 300;
  for (const p of stopnie) {
    const g = d.podium[p.i];
    if (!g) continue;
    const [jasny, metal, ciemny] = METALE[g.miejsce] ?? ["#3a4552", "#27313b", "#11161b"];
    const gora = DNO - p.wys;
    const blok = ctx.createLinearGradient(0, gora, 0, DNO);
    blok.addColorStop(0, jasny);
    blok.addColorStop(0.35, metal);
    blok.addColorStop(1, ciemny);
    ctx.fillStyle = blok;
    ctx.fillRect(p.x - SZER_STOPNIA / 2, gora, SZER_STOPNIA, p.wys);
    tekst(ctx, String(g.miejsce), p.x, gora + Math.min(p.wys - 30, 130), 110, "rgba(0, 0, 0, 0.55)", 800);

    tekst(ctx, `${g.punkty.toLocaleString("pl-PL")} pkt`, p.x, gora - 30, 32, SZARY, 600);
    tekst(ctx, g.nick, p.x, gora - 76, p.i === 0 ? 52 : 42, metal, 800, SZER_STOPNIA + 20);
    await rysujAwatar(ctx, g, p.x, gora - 160 - p.r, p.r);
  }
  // linia podłogi pod stopniami
  ctx.fillStyle = ZLOTO;
  ctx.fillRect(S * 0.05, DNO, S * 0.9, 4);

  if (d.oznaczenia?.length) tekst(ctx, d.oznaczenia.join("  "), S / 2, 1620, 34, SZARY, 600, S - 120);
  tekst(ctx, [d.lokal?.nazwa, d.data].filter(Boolean).join(" · "), S / 2, 1700, 36, PIANA, 600, S - 120);
  tekst(ctx, "Piwu Cześć!", S / 2, 1780, 44, ZLOTO, 800);
  return naBlob(plotno);
}

/**
 * Udostępnia grafikę systemowym „Udostępnij” (na telefonie: Zapisz obraz, Instagram, Facebook, Messenger…),
 * a na komputerze (także Safari na Macu, który umie udostępniać) po prostu pobiera plik. Zwraca, co się stało.
 */
export async function udostepnij(blob: Blob, nazwa: string, tekstPosta: string): Promise<"udostepniono" | "pobrano" | "anulowano"> {
  const plik = new File([blob], nazwa, { type: "image/png" });
  const dotykowy = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (dotykowy && navigator.canShare?.({ files: [plik] })) {
    try {
      await navigator.share({ files: [plik], text: tekstPosta });
      return "udostepniono";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "anulowano";
    }
  }
  pobierz(blob, nazwa);
  return "pobrano";
}

/** Pobiera grafikę jako plik (na iPhonie trafia do Plików, na Androidzie do Pobranych). */
export function pobierz(blob: Blob, nazwa: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nazwa;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
