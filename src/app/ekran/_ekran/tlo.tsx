"use client";
/* eslint-disable @next/next/no-img-element -- logo lokalu z bucketu Supabase, skalowane CSS-em */

// Ruchome tło wszystkich ekranów TV: ciepłe plamy światła jak od świec i szerokie smugi światła,
// które powoli się kołyszą, jak światło z okna baru albo lampy nad nalewakami. Bardzo słabe, żeby nie
// przeszkadzało w czytaniu, i na samych transformacjach CSS, żeby przeglądarka telewizora nie musiała
// przeliczać układu. Ruch pomaga też OLED-om. (Bąbelki są tylko w szklance wyścigu.)

export function TloTv() {
  return (
    <div className="tv-tlo" aria-hidden>
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

/**
 * Tło klasycznego pub quizu i ekranu lokalu (26.10): zamiast baru i nastrojów wyścigu logo lokalu na cały ekran,
 * przygaszone, które bardzo powoli oddycha i się kołysze, plus ciepłe plamy światła, smugi z góry, ciepły reflektor
 * na środku i ciemne brzegi. Na ekranie lokalu (`lokal` = null) to samo bez logo w tle. Tylko transformacje
 * i przezroczystość, bez `clip-path`, więc działa też na starszych Samsungach (prosty ekran ma swoją kopię).
 * Bez logo zostaje nazwa lokalu.
 */
export function TloLokalu({ lokal }: { lokal: { nazwa: string; logo_url: string | null } | null }) {
  return (
    <div className="tv-tlo tv-tlo-lokalu" aria-hidden>
      {/* nastrój baru bez zdjęcia: ciepłe plamy światła, wolno kołyszące się smugi z góry i ciemne brzegi */}
      <span className="tv-blask tv-blask-1" />
      <span className="tv-blask tv-blask-2" />
      <span className="tv-blask tv-blask-3" />
      <span className="tv-smuga tv-smuga-1" />
      <span className="tv-smuga tv-smuga-2" />
      <span className="tv-smuga tv-smuga-3" />
      <span className="tv-tlo-reflektor" />
      <span className="tv-tlo-ciemne-brzegi" />
      {lokal?.logo_url ? (
        <img src={lokal.logo_url} alt="" className="tv-tlo-logo" />
      ) : lokal?.nazwa ? (
        <span className="tv-tlo-logo tv-tlo-nazwa">{lokal.nazwa}</span>
      ) : null}
    </div>
  );
}
