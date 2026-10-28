import { widziWszystko, type Rola } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { przeczytajPowiadomienia } from "../akcje-powiadomien";

const kiedy = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

/**
 * Nieprzeczytane powiadomienia głównego admina (tabela `powiadomienia`, 28.10): pasek pod nagłówkiem panelu na każdej
 * stronie, aż kliknie „OK”. Np. lokal zwolnił ekran, kończąc grę Bractwa przed startem. Lokal ich nie widzi.
 */
export async function Powiadomienia({ rola }: { rola: Rola }) {
  if (!widziWszystko(rola)) return null;
  const { data } = await supabaseAdmin()
    .from("powiadomienia")
    .select("id, utworzono, tresc")
    .is("przeczytane", null)
    .order("utworzono")
    .returns<{ id: string; utworzono: string; tresc: string }[]>();
  if (!data?.length) return null;
  return (
    <section className="powiadomienia" role="status">
      <ul>
        {data.map((p) => (
          <li key={p.id}>
            <span className="powiadomienia-kiedy">{kiedy.format(new Date(p.utworzono))}</span> {p.tresc}
          </li>
        ))}
      </ul>
      <form action={przeczytajPowiadomienia}>
        <button type="submit" className="przycisk-maly">
          OK
        </button>
      </form>
    </section>
  );
}
