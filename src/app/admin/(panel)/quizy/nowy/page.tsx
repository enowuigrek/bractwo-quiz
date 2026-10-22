import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { FormularzQuizu } from "../formularz-quizu";

export const metadata: Metadata = { title: "Nowy quiz · Bractwo Quiz" };

export default async function NowyQuiz() {
  await wymagajAdmina();
  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <h1>Nowy quiz</h1>
      <section className="karta">
        <FormularzQuizu />
      </section>
    </main>
  );
}
