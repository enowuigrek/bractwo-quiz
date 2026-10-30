import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { NAZWY_RODZAJOW, nowyQuiz } from "@/lib/tagi";
import { FormularzQuizu } from "../formularz-quizu";

export const metadata: Metadata = { title: "Nowy quiz · Bractwo Quiz" };

export default async function NowyQuiz({ searchParams }: PageProps<"/admin/quizy/nowy">) {
  await wymagajAdmina();
  const { rodzaj: rodzajZAdresu } = await searchParams;
  // rodzaj z zakładki listy quizów; w formularzu już się go nie zmienia
  const rodzaj = rodzajZAdresu === "klasyczny" ? "klasyczny" : "wyscig";
  return (
    <main>
      <p className="okruchy">
        <Link href={rodzaj === "klasyczny" ? "/admin/quizy?rodzaj=klasyczny" : "/admin/quizy"}>
          ← {NAZWY_RODZAJOW[rodzaj]}
        </Link>
      </p>
      <h1>{nowyQuiz(rodzaj)}</h1>
      <section className="karta">
        <FormularzQuizu rodzaj={rodzaj} />
      </section>
    </main>
  );
}
