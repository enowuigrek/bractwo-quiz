import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { adresAplikacji } from "@/lib/adres";
import { maHasloLokalu, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { wymagajLokalu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { LinkDoSkopiowania } from "../../gry/[id]/kopiuj";
import { usunLokal } from "../akcje";
import { FormularzLokalu } from "../formularz";
import { FormularzHasla } from "../haslo";

export const metadata: Metadata = { title: "Lokal · Bractwo Quiz" };

export default async function EdycjaLokalu({ params }: PageProps<"/admin/lokale/[id]">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  wymagajLokalu(rola, id);
  const glowny = widziWszystko(rola);
  const db = supabaseAdmin();
  const [{ data: lokal }, { data: wszystkie }] = await Promise.all([
    db.from("lokale").select("id, nazwa, miasto, logo_url, adres_ekranu, instagram").eq("id", id).maybeSingle<Lokal>(),
    db.from("lokale").select("miasto"),
  ]);
  if (!lokal) notFound();

  const adres = await adresAplikacji();
  const ekran = `${adres}/ekran/${lokal.adres_ekranu}`;
  const panel = `${adres}/admin/${lokal.adres_ekranu}`;
  const ma = await maHasloLokalu(lokal.id);
  // SVG z biblioteki qrcode; jedyne dane to adres, który sami złożyliśmy
  const qrEkranu = await QRCode.toString(ekran, { type: "svg", margin: 0, errorCorrectionLevel: "M" });

  const miasta = [...new Set((wszystkie ?? []).map((p) => p.miasto as string | null).filter((m): m is string => !!m))];

  return (
    <main>
      <p className="okruchy">{glowny ? <Link href="/admin/lokale">← Lokale</Link> : "Mój lokal"}</p>
      <h1>{lokal.nazwa}</h1>
      {/* dwie kolumny kart, każda ułożona osobno: hasło stoi zaraz pod ekranem, bez dziury obok długiego formularza
          (26.10) */}
      <div className="uklad-dwa">
        <div className="stos-kart">
          <section className="karta">
            <FormularzLokalu lokal={lokal} miasta={miasta} ograniczony={!glowny} />
          </section>
          <section className="karta">
            <h2>Panel lokalu</h2>
            <p className="pomocniczy" style={{ marginTop: 0 }}>
              {glowny
                ? ma
                  ? "Lokal loguje się do swojego panelu pod tym adresem i swoim hasłem. Widzi tylko swoje gry i quizy, a Twoje quizy bez kłódki może uruchamiać, bez zmieniania."
                  : "Lokal nie ma jeszcze hasła, więc nie zaloguje się do swojego panelu. Ustaw mu hasło na start; potem sam je zmieni."
                : "Pod tym adresem logujesz się do panelu. Po zmianie hasła inne urządzenia trzeba zalogować od nowa."}
            </p>
            <LinkDoSkopiowania url={panel} />
          </section>
        </div>
        <div className="stos-kart">
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
          <section className="karta">
            <h2>Hasło panelu</h2>
            <FormularzHasla lokalId={lokal.id} ma={ma} />
          </section>
        </div>
      </div>
      {glowny && (
        <section className="panel-sekcja">
          <PrzyciskPotwierdz
            akcja={usunLokal.bind(null, lokal.id)}
            pytanie={`Usunąć lokal „${lokal.nazwa}”? Rozegrane w nim gry zostaną w historii, tylko bez lokalu. Zakładka ekranu na TV w tym lokalu przestanie działać.`}
          >
            Usuń lokal
          </PrzyciskPotwierdz>
        </section>
      )}
    </main>
  );
}
