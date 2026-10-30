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
      {/* dwie kolumny kart w dwóch rzędach: karty w jednym rzędzie mają tę samą wysokość (28.10, Łukasz: dane lokalu
          i ekran lokalu równe), na telefonie jedna pod drugą */}
      <div className="uklad-dwa uklad-rzedy">
        <section className="karta">
          <FormularzLokalu lokal={lokal} miasta={miasta} ograniczony={!glowny} />
        </section>
        <section className="karta">
          <h2>Ekran lokalu</h2>
          <div className="qr" dangerouslySetInnerHTML={{ __html: qrEkranu }} />
          <LinkDoSkopiowania url={ekran} />
        </section>
        <section className="karta">
          <h2>Panel lokalu</h2>
          {!ma && <p className="blad">Lokal nie ma hasła, więc się nie zaloguje.</p>}
          <LinkDoSkopiowania url={panel} />
        </section>
        <section className="karta">
          <h2>Hasło panelu</h2>
          <FormularzHasla lokalId={lokal.id} ma={ma} />
        </section>
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
