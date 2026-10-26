"use client";

import { useRef, useState } from "react";
import { IkonaGotowe, IkonaKopiuj } from "@/components/ikony";

/** Po ilu ms przytrzymania palcem link się kopiuje (zamiast otwierać). */
const PRZYTRZYMANIE_MS = 450;

/** Kopiuje tekst. Gdy Clipboard API jest niedostępne albo odmówi, próbuje starym sposobem przez zaznaczenie. */
export async function skopiuj(tekst: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(tekst);
    return true;
  } catch {
    const pole = document.createElement("textarea");
    pole.value = tekst;
    pole.setAttribute("readonly", "");
    pole.style.position = "fixed";
    pole.style.opacity = "0";
    document.body.appendChild(pole);
    pole.select();
    pole.setSelectionRange(0, tekst.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    pole.remove();
    return ok;
  }
}

/**
 * Link w ramce: kliknięcie otwiera go w nowej karcie, ikona obok kopiuje.
 * Na telefonie przytrzymanie palcem na linku też kopiuje. Po skopiowaniu na dole wyskakuje komunikat.
 */
export function LinkDoSkopiowania({ url }: { url: string }) {
  const [komunikat, ustawKomunikat] = useState<{ tekst: string; ok: boolean } | null>(null);
  const zegar = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotykOd = useRef(0);
  const pominKlik = useRef(false);

  async function kopiuj() {
    const ok = await skopiuj(url);
    ustawKomunikat(ok ? { tekst: "Skopiowano link", ok } : { tekst: "Nie udało się skopiować. Zaznacz link ręcznie.", ok });
    if (zegar.current) clearTimeout(zegar.current);
    zegar.current = setTimeout(() => ustawKomunikat(null), 2200);
  }

  return (
    <>
      <div className="link-kopiuj">
        <a
          href={url}
          target="_blank"
          rel="noopener"
          title="Otwórz w nowej karcie"
          onPointerDown={(e) => {
            if (e.pointerType === "touch") dotykOd.current = Date.now();
          }}
          onPointerUp={(e) => {
            // przytrzymanie palcem: kopiujemy w puszczeniu (to jest gest użytkownika, więc schowek zadziała)
            if (e.pointerType === "touch" && dotykOd.current && Date.now() - dotykOd.current >= PRZYTRZYMANIE_MS) {
              pominKlik.current = true;
              void kopiuj();
            }
            dotykOd.current = 0;
          }}
          onPointerCancel={() => (dotykOd.current = 0)}
          onClick={(e) => {
            if (pominKlik.current) {
              e.preventDefault();
              pominKlik.current = false;
            }
          }}
          onContextMenu={(e) => {
            if (dotykOd.current) e.preventDefault();
          }}
        >
          {url.replace(/^https?:\/\//, "")}
        </a>
        <button type="button" className="link-kopiuj-ikona" onClick={() => void kopiuj()} aria-label="Kopiuj link" title="Kopiuj link">
          {komunikat?.ok ? <IkonaGotowe /> : <IkonaKopiuj />}
        </button>
      </div>
      {komunikat && (
        <p className={`dymek${komunikat.ok ? "" : " zly"}`} role="status">
          {komunikat.tekst}
        </p>
      )}
    </>
  );
}
