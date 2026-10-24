"use client";

import { useWideoCzuwania } from "@/lib/ekran-tv";

// Ruchome tło wszystkich ekranów TV: ciepłe plamy światła jak od świec i szerokie smugi światła,
// które powoli się kołyszą, jak światło z okna baru albo lampy nad nalewakami. Bardzo słabe, żeby nie
// przeszkadzało w czytaniu, i na samych transformacjach CSS, żeby przeglądarka telewizora nie musiała
// przeliczać układu. Ruch pomaga też OLED-om. (Bąbelki są tylko w szklance wyścigu.)
// Na samym spodzie gra prawie czarne wideo, które nie pozwala telewizorowi włączyć wygaszacza.

export function TloTv() {
  const wideo = useWideoCzuwania();
  return (
    <div className="tv-tlo" aria-hidden>
      <video
        ref={wideo}
        className="tv-czuwanie"
        src="/wideo/czuwanie.mp4"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
      />
      {/* tła nastrojów etapów (public/grafiki/tlo-*.webp, scripts/grafiki.mjs): widać tylko to z bieżącego
          nastroju, przenikają się przy zmianie etapu (tv.css, [data-nastroj]) */}
      {["poczekalnia", "noir1", "noir2", "neon", "walka", "podium"].map((n) => (
        <span key={n} className={`tv-obraz tv-obraz-${n}`} />
      ))}
      <span className="tv-blask tv-blask-1" />
      <span className="tv-blask tv-blask-2" />
      <span className="tv-blask tv-blask-3" />
      <span className="tv-smuga tv-smuga-1" />
      <span className="tv-smuga tv-smuga-2" />
      <span className="tv-smuga tv-smuga-3" />
      {/* nastroje etapów (tv.css, [data-nastroj]): cienie żaluzji w etapach noir, winieta w walce o finał */}
      <span className="tv-zaluzje" />
      <span className="tv-winieta" />
    </div>
  );
}
