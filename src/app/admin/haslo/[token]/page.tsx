import type { Metadata } from "next";
import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { kontoZLinku } from "@/lib/admin";
import { FormularzHaslaZLinku } from "../../logowanie/formularz";

export const metadata: Metadata = { title: "Hasło · Bractwo Quiz", robots: { index: false } };

/** Jednorazowy link od Łukasza (nowe konto albo reset hasła), ważny 7 dni. */
export default async function HasloZLinku({ params }: PageProps<"/admin/haslo/[token]">) {
  const { token } = await params;
  const konto = await kontoZLinku(token);
  return (
    <div className="logowanie-ekran">
      <main className="kolumna logowanie">
        <h1>
          <LogoQuiz wysokosc={72} dopisek="panel" priorytet />
        </h1>
        {konto ? (
          <>
            <p>
              <strong>{konto.nazwa}</strong> · {konto.email}
            </p>
            <FormularzHaslaZLinku token={token} />
          </>
        ) : (
          <>
            <p className="blad">Link wygasł albo był już użyty. Poproś o nowy.</p>
            <Link href="/admin/logowanie" className="przycisk logowanie-dalej">
              Logowanie
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
