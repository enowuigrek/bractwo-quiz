import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { adresAplikacji } from "@/lib/adres";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { LinkDoSkopiowania } from "../../gry/[id]/kopiuj";
import { usunLokal } from "../akcje";
import { FormularzLokalu } from "../formularz";

export const metadata: Metadata = { title: "Lokal · Bractwo Quiz" };

export default async function EdycjaLokalu({ params }: PageProps<"/admin/lokale/[id]">) {
  await wymagajAdmina();
  const { id } = await params;
  const db = supabaseAdmin();
  const [{ data: lokal }, { data: wszystkie }] = await Promise.all([
    db.from("lokale").select("id, nazwa, miasto, logo_url, adres_ekranu, instagram").eq("id", id).maybeSingle<Lokal>(),
    db.from("lokale").select("miasto"),
  ]);
  if (!lokal) notFound();

  const ekran = `${await adresAplikacji()}/ekran/${lokal.adres_ekranu}`;
  // SVG z biblioteki qrcode; jedyne dane to adres, który sami złożyliśmy
  const qrEkranu = await QRCode.toString(ekran, { type: "svg", margin: 0, errorCorrectionLevel: "M" });

  const miasta = [...new Set((wszystkie ?? []).map((p) => p.miasto as string | null).filter((m): m is string => !!m))];

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/lokale">← Lokale</Link>
      </p>
      <h1>{lokal.nazwa}</h1>
      <div className="uklad-dwa">
        <section className="karta">
          <FormularzLokalu lokal={lokal} miasta={miasta} />
        </section>
        <section className="karta">
          <h2>Ekran lokalu</h2>
          <p className="pomocniczy" style={{ marginTop: 0 }}>
            Otwórz ten adres na TV w lokalu i zapisz w zakładkach. Gdy nie ma gry, ekran pokazuje plansze Bractwa, a gdy
            uruchomisz grę w tym lokalu, sam przełączy się na nią. Kod QR pomaga przenieść adres z telefonu na TV.
          </p>
          <div className="qr" dangerouslySetInnerHTML={{ __html: qrEkranu }} />
          <div style={{ marginTop: 14 }}>
            <LinkDoSkopiowania url={ekran} />
          </div>
        </section>
      </div>
      <section className="panel-sekcja">
        <PrzyciskPotwierdz
          akcja={usunLokal.bind(null, lokal.id)}
          pytanie={`Usunąć lokal „${lokal.nazwa}”? Rozegrane w nim gry zostaną w historii, tylko bez lokalu. Zakładka ekranu na TV w tym lokalu przestanie działać.`}
        >
          Usuń lokal
        </PrzyciskPotwierdz>
      </section>
    </main>
  );
}
