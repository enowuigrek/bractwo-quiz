"use client";

import { useEffect, useState } from "react";
import { WIDEO_WYLEWANIA } from "@/lib/pijany";

// Wideo pękającej szklanki (pijany finał) pobierane z wyprzedzeniem: element <video> wchodzi na scenę dopiero przy
// gaśnięciu telefonów (Samsung gra jeden odtwarzacz naraz, wcześniejsze wideo uciszało muzykę), a 2,4 MB nie
// zawsze zdążyło się wczytać w te kilka sekund i szklanka nie wybuchała (26.10, OLED Łukasza). Zwykłe `fetch`
// nie dotyka odtwarzaczy, więc plik leży w pamięci od finału serią, a wideo dostaje gotowy adres `blob:`.

let wczytane: Promise<string> | null = null;

/** Pobiera klip raz na stronę; przy błędzie sieci zostaje zwykły adres pliku. */
export function wczytajWideoWybuchu(): Promise<string> {
  wczytane ??= fetch(WIDEO_WYLEWANIA)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then((b) => URL.createObjectURL(b))
    .catch(() => {
      wczytane = null;
      return WIDEO_WYLEWANIA;
    });
  return wczytane;
}

/** Adres klipu do <video>: `blob:` z pamięci, a dopóki się pobiera, zwykły adres pliku. */
export function useWideoWybuchu(): string {
  const [adres, ustawAdres] = useState(WIDEO_WYLEWANIA);
  useEffect(() => {
    let aktualny = true;
    void wczytajWideoWybuchu().then((a) => {
      if (aktualny) ustawAdres(a);
    });
    return () => {
      aktualny = false;
    };
  }, []);
  return adres;
}
