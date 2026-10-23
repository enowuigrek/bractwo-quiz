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
      <span className="tv-blask tv-blask-1" />
      <span className="tv-blask tv-blask-2" />
      <span className="tv-blask tv-blask-3" />
      <span className="tv-smuga tv-smuga-1" />
      <span className="tv-smuga tv-smuga-2" />
      <span className="tv-smuga tv-smuga-3" />
    </div>
  );
}
