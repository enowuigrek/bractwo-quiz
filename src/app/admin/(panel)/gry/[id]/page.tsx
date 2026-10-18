import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { adresAplikacji } from "@/lib/adres";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { NAZWY_FAZ, type Sesja } from "@/lib/typy";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { usunGre, zakonczGre } from "../akcje";
import { LinkDoSkopiowania } from "./kopiuj";

export const metadata: Metadata = { title: "Gra · Bractwo Quiz" };

type GraZDanymi = Sesja & {
  quizy: { tytul: string } | null;
  piwiarnie: { nazwa: string; miasto: string | null } | null;
};

export default async function Gra({ params }: PageProps<"/admin/gry/[id]">) {
  await wymagajAdmina();
  const { id } = await params;
  const db = supabaseAdmin();

  const [{ data: gra }, { count: gracze }] = await Promise.all([
    db.from("sesje").select("*, quizy(tytul), piwiarnie(nazwa, miasto)").eq("id", id).maybeSingle<GraZDanymi>(),
    db.from("gracze").select("id", { count: "exact", head: true }).eq("sesja_id", id),
  ]);
  if (!gra) notFound();

  const adres = await adresAplikacji();
  const linki = {
    tv: `${adres}/tv/${gra.kod}`,
    gracz: `${adres}/${gra.kod}`,
    pilot: `${adres}/pilot/${gra.kod}?t=${gra.host_token}`,
  };
  const trwa = gra.faza !== "koniec";
  // SVG z biblioteki qrcode, bez danych od użytkownika poza adresem, który sami złożyliśmy
  const qrPilota = trwa ? await QRCode.toString(linki.pilot, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) : null;

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/gry">← Gry</Link>
      </p>
      <p className="pomocniczy" style={{ margin: 0 }}>
        Kod gry · <span className={`znaczek${trwa ? " aktywny" : ""}`}>{NAZWY_FAZ[gra.faza]}</span>
      </p>
      <div className="kod-gry">{gra.kod}</div>
      <h1 style={{ marginTop: 16 }}>{gra.quizy?.tytul ?? "quiz usunięty"}</h1>
      <p className="pomocniczy">
        {[
          gra.piwiarnie ? `${gra.piwiarnie.nazwa}${gra.piwiarnie.miasto ? `, ${gra.piwiarnie.miasto}` : ""}` : "bez lokalu",
          gra.okazja,
          gra.tryb === "druzyny" ? "drużyny" : "każdy sam",
          gra.bonus_czas ? "z bonusem za szybkość" : "bez bonusu",
          `graczy: ${gracze ?? 0}/${gra.max_graczy}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {trwa && qrPilota && (
        <>
          <section className="panel-sekcja karta">
            <h2>Pilot prowadzącego</h2>
            <p className="pomocniczy" style={{ marginTop: 0 }}>
              Prowadzący skanuje ten kod telefonem i ma pilota. Link zawiera tajny klucz, nie pokazuj go graczom.
            </p>
            <div className="qr" dangerouslySetInnerHTML={{ __html: qrPilota }} />
            <div style={{ marginTop: 14 }}>
              <LinkDoSkopiowania url={linki.pilot} />
            </div>
          </section>

          <section className="panel-sekcja karta">
            <h2>Telewizor</h2>
            <p className="pomocniczy" style={{ marginTop: 0 }}>
              Otwórz w przeglądarce na TV. Na ekranie pojawi się kod QR dla graczy.
            </p>
            <LinkDoSkopiowania url={linki.tv} />
          </section>

          <section className="panel-sekcja karta">
            <h2>Gracze</h2>
            <p className="pomocniczy" style={{ marginTop: 0 }}>
              Gracze skanują QR z telewizora albo wpisują kod <strong>{gra.kod}</strong> na stronie głównej.
            </p>
            <LinkDoSkopiowania url={linki.gracz} />
          </section>
        </>
      )}

      <section className="panel-sekcja">
        {trwa ? (
          <PrzyciskPotwierdz
            akcja={zakonczGre.bind(null, gra.id)}
            pytanie={`Zakończyć grę ${gra.kod}? Gracze nie będą mogli już dołączyć ani odpowiadać.`}
          >
            Zakończ grę
          </PrzyciskPotwierdz>
        ) : (
          <PrzyciskPotwierdz
            akcja={usunGre.bind(null, gra.id)}
            pytanie={`Usunąć grę ${gra.kod} razem z graczami i wynikami?`}
          >
            Usuń grę
          </PrzyciskPotwierdz>
        )}
      </section>
    </main>
  );
}
