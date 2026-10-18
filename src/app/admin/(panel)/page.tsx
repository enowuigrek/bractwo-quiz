import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";

export default async function Panel() {
  await wymagajAdmina();
  const db = supabaseAdmin();
  const [piwiarnie, quizy, sesje] = await Promise.all([
    db.from("piwiarnie").select("*", { count: "exact", head: true }),
    db.from("quizy").select("*", { count: "exact", head: true }),
    db.from("sesje").select("*", { count: "exact", head: true }),
  ]);
  const blad = piwiarnie.error ?? quizy.error ?? sesje.error;

  return (
    <main>
      <h1>Panel</h1>
      {blad ? (
        <p className="blad">Brak połączenia z bazą: {blad.message}</p>
      ) : (
        <div className="karta">
          <p style={{ margin: 0 }}>
            Piwiarnie: <strong>{piwiarnie.count}</strong> · Quizy: <strong>{quizy.count}</strong> · Gry:{" "}
            <strong>{sesje.count}</strong>
          </p>
          <p className="pomocniczy" style={{ marginBottom: 0 }}>
            Edytory piwiarni, quizów i zadań dochodzą w dniu 2.
          </p>
        </div>
      )}
    </main>
  );
}
