import type { Rola, RolaKonta } from "@/lib/admin";

/** Aktywna rola zalogowanego jako rola konta (do ponownego zalogowania po zmianie hasła). */
export const kodRoliZRoli = (rola: Rola): RolaKonta =>
  rola.typ === "lokal" ? { rola: "lokal", lokalId: rola.lokalId } : { rola: rola.typ };
