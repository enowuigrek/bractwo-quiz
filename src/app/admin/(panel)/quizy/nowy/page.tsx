import type { Metadata } from "next";
import Link from "next/link";
import { widziWszystko, wymagajAdmina } from "@/lib/admin";
import { FormularzQuizu } from "../formularz-quizu";

export const metadata: Metadata = { title: "Nowy quiz · Bractwo Quiz" };

export default async function NowyQuiz({ searchParams }: PageProps<"/admin/quizy/nowy">) {
  const rola = await wymagajAdmina();
  const { rodzaj } = await searchParams;
  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <h1>Nowy quiz</h1>
      <section className="karta">
        <FormularzQuizu glowny={widziWszystko(rola)} rodzaj={rodzaj === "klasyczny" ? "klasyczny" : "wyscig"} />
      </section>
    </main>
  );
}
