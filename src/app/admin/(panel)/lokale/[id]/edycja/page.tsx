import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { adresAplikacji } from "@/lib/adres";
import { jestTworca, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { wymagajLokalu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { PrzyciskPotwierdz } from "../../../_komponenty/przycisk-potwierdz";
import { LinkDoSkopiowania } from "../../../gry/[id]/kopiuj";
import { usunLokal } from "../../akcje";
import { FormularzLokalu } from "../../formularz";

export const metadata: Metadata = { title: "Ustawienia lokalu · Bractwo Quiz" };

export default async function EdycjaLokalu({ params }: PageProps<"/admin/lokale/[id]/edycja">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  wymagajLokalu(rola, id);
  const glowny = widziWszystko(rola);
  const db = supabaseAdmin();
  const [{ data: lokal }, { data: wszystkie }, { data: osoby }] = await Promise.all([
    db.from("lokale").select("id, nazwa, miasto, logo_url, adres_ekranu, instagram").eq("id", id).maybeSingle<Lokal>(),
    db.from("lokale").select("miasto"),
    // osoby z dostępem do panelu tego lokalu (konta osobowe, 30.10)
    db
      .from("konta_role")
      .select("konta(id, nazwa, email, zablokowane)")
      .eq("rola", "lokal")
      .eq("lokal_id", id)
      .returns<{ konta: { id: string; nazwa: string; email: string; zablokowane: boolean } | null }[]>(),
  ]);
  if (!lokal) notFound();

  const adres = await adresAplikacji();
  const ekran = `${adres}/ekran/${lokal.adres_ekranu}`;
  // SVG z biblioteki qrcode; jedyne dane to adres, który sami złożyliśmy
  const qrEkranu = await QRCode.toString(ekran, { type: "svg", margin: 0, errorCorrectionLevel: "M" });

  const miasta = [...new Set((wszystkie ?? []).map((p) => p.miasto as string | null).filter((m): m is string => !!m))];

  return (
    <main>
      <p className="okruchy">
        <Link href={`/admin/lokale/${lokal.id}`}>← {lokal.nazwa}</Link>
      </p>
      <h1>Ustawienia lokalu</h1>
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
          <h2>Osoby</h2>
          {osoby?.length ? (
            <ul className="lista">
              {osoby
                .flatMap((o) => (o.konta ? [o.konta] : []))
                .map((k) => (
                  <li key={k.id}>
                    <div className="lista-glowna">
                      <div className="lista-tytul">
                        <Link href={`/admin/osoby/${k.id}`}>{k.nazwa}</Link>
                      </div>
                      {/* e-mail widzi tylko twórca (30.10) */}
                      {(jestTworca(rola) || k.zablokowane) && (
                        <div className="lista-opis">{k.zablokowane ? "zablokowane" : k.email}</div>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="lista-pusta">Nikt nie ma jeszcze dostępu do panelu lokalu.</p>
          )}
          {jestTworca(rola) && (
            <Link href={`/admin/konta/nowe?lokal=${lokal.id}`} className="przycisk-maly">
              + Dodaj osobę
            </Link>
          )}
        </section>
      </div>
      {jestTworca(rola) && (
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
