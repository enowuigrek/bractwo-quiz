// Wersja wdrożenia (commit na Vercelu). Ekrany TV są otwarte godzinami i po wdrożeniu dalej mają stary kod,
// więc co minutę pytają tutaj i przeładowują się same, gdy wersja się zmieni (src/lib/ekran-tv.ts).

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { wersja: process.env.VERCEL_GIT_COMMIT_SHA ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
