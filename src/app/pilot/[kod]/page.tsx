import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { jestTworca, rolaAdmina } from "@/lib/admin";
import { markaZadania } from "@/lib/motyw-serwer";
import { poprawnyKod } from "@/lib/gra/kod";
import { NaglowekPanelu } from "@/app/admin/(panel)/_komponenty/naglowek-panelu";
import { Pilot } from "./pilot";

export async function generateMetadata({ params }: PageProps<"/pilot/[kod]">): Promise<Metadata> {
  const { kod } = await params;
  // nazwa aplikacji dopisuje szablon tytułu z layoutu (według motywu)
  return { title: `Pilot ${kod.toUpperCase()}`, robots: { index: false } };
}

export default async function StronaPilota({ params, searchParams }: PageProps<"/pilot/[kod]">) {
  const { kod } = await params;
  const { t } = await searchParams;
  if (!poprawnyKod(kod)) notFound();
  const token = typeof t === "string" ? t : null;
  if (kod !== kod.toUpperCase()) {
    redirect(`/pilot/${kod.toUpperCase()}${token ? `?t=${encodeURIComponent(token)}` : ""}`);
  }

  // boty do testów tylko dla głównego (26.10): lokale ich nie potrzebują
  const rola = await rolaAdmina();
  // zalogowany: nagłówek panelu nad pilotem (na komputerze zakładki i konto, na telefonie menu), szerokość jak panel
  if (rola) {
    return (
      <div className="pilot-strona">
        <NaglowekPanelu rola={rola} />
        <main className="kolumna kolumna-pilot">
          {/* boty: twórca, a na adresie JOWES każde zalogowane konto (18.11, Zbyszko testuje sam) */}
          <Pilot
            kod={kod}
            tokenZAdresu={token}
            boty={jestTworca(rola) || (await markaZadania()).zasady.botyDlaKazdego}
            naglowek={false}
          />
        </main>
      </div>
    );
  }
  return (
    <main className="kolumna kolumna-pilot">
      <Pilot kod={kod} tokenZAdresu={token} boty={false} />
    </main>
  );
}
