import { redirect } from "next/navigation";

/** Dawne logowanie lokalu pod `/admin/<adres_ekranu>` (26.10–30.10): teraz jedno logowanie kontem osobowym. */
export default function DawneLogowanieLokalu() {
  redirect("/admin/logowanie");
}
