"use client";

import { motion, MotionConfig } from "motion/react";
import { Awatar } from "@/components/awatar";
import type { StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { naTrasie } from "@/lib/gra/wyscig";
import { Licznik } from "./ranking";

/** Po ilu sekundach od wejścia ekranu piwo zaczyna się dolewać (najpierw widać stan sprzed pytania). */
const START_S = 0.8;
const DOLEWANIE_S = 2.4;

/**
 * „Wyścig do nalewaka”: każdy gracz ma swoją rurę, która napełnia się piwem z pianą, a awatar jedzie
 * na czole piany do mety z nalewakiem. Najpierw widać położenie sprzed pytania, potem piwo dolewa się
 * do nowego (zasady położenia: src/lib/gra/wyscig.ts). Tory są w kolejności miejsc po pytaniu.
 */
export function WyscigTv({ stan, ranking }: { stan: StanSesji; ranking: WierszRankingu[] }) {
  const z = stan.zadanie;
  const n = stan.quiz?.liczba_zadan ?? 0;
  const lp = z?.lp ?? 0;
  const wiersze = [...ranking].sort((a, b) => a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl"));
  const lider = Math.max(0, ...wiersze.map((w) => w.punkty));
  const liderPrzed = Math.max(0, ...wiersze.map((w) => w.punkty - w.zdobyte));
  // wysokość toru: wszystkie tory mieszczą się w ok. 580 px sceny (nad nimi nalewak), przy wielu ciaśniej
  const odstep = wiersze.length > 8 ? 6 : 12;
  const tor = Math.min(92, Math.floor((580 - (wiersze.length - 1) * odstep) / Math.max(1, wiersze.length)));

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-wyscig">
        <header className="tv-ranking-gora">
          <h1>Wyścig do nalewaka</h1>
          {z && (
            <p className="tv-okazja">
              po pytaniu {lp}/{n}
            </p>
          )}
        </header>

        <div className="wyscig-tory" style={{ "--tor": `${tor}px`, gap: odstep } as React.CSSProperties}>
          <Nalewak />
          {wiersze.map((w, i) => {
            const przed = naTrasie(w.punkty - w.zdobyte, liderPrzed, lp - 1, n) * 100;
            const teraz = naTrasie(w.punkty, lider, lp, n) * 100;
            const prowadzi = w.miejsce === 1 && w.punkty > 0;
            const ruch = { delay: START_S + i * 0.08, duration: DOLEWANIE_S, ease: [0.22, 1, 0.36, 1] as const };
            return (
              <div key={w.nick} className={`wyscig-wiersz${prowadzi ? " lider" : ""}`}>
                <span className="wyscig-miejsce">{w.miejsce}.</span>
                <span className="wyscig-nick">{w.nick}</span>
                <div className="wyscig-rura">
                  <motion.div
                    className="wyscig-piwo"
                    initial={{ width: `${przed}%` }}
                    animate={{ width: `${teraz}%` }}
                    transition={ruch}
                  />
                  <motion.div
                    className="wyscig-jezdziec"
                    initial={{ left: `${przed}%` }}
                    animate={{ left: `${teraz}%` }}
                    transition={ruch}
                  >
                    <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={Math.round(tor * 0.92)} />
                  </motion.div>
                </div>
                <span className="wyscig-punkty">
                  <Licznik wartosc={w.punkty} />
                  {w.zdobyte > 0 && <span className="wyscig-zdobyte">+{w.zdobyte}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </MotionConfig>
  );
}

/** Meta: złoty nalewak nad szachownicową linią mety. */
function Nalewak() {
  return (
    <div className="wyscig-meta" aria-hidden>
      <svg className="wyscig-nalewak" viewBox="0 0 120 150">
        <defs>
          <linearGradient id="nalewak-zloto" x1="0" x2="1">
            <stop offset="0" stopColor="#8a5d10" />
            <stop offset="0.45" stopColor="#fbe7a1" />
            <stop offset="1" stopColor="#a8741a" />
          </linearGradient>
          <linearGradient id="nalewak-drewno" x1="0" x2="1">
            <stop offset="0" stopColor="#3a2410" />
            <stop offset="0.5" stopColor="#6b4520" />
            <stop offset="1" stopColor="#2b1a0b" />
          </linearGradient>
        </defs>
        {/* rączka */}
        <rect x="46" y="4" width="28" height="62" rx="14" fill="url(#nalewak-drewno)" />
        <rect x="54" y="62" width="12" height="14" fill="url(#nalewak-zloto)" />
        {/* korpus i wylewka */}
        <rect x="20" y="74" width="80" height="30" rx="10" fill="url(#nalewak-zloto)" />
        <path d="M44 104 h32 v14 q0 10 -10 10 h-12 q-10 0 -10 -10 z" fill="url(#nalewak-zloto)" />
        <rect x="54" y="126" width="12" height="14" rx="4" fill="url(#nalewak-zloto)" />
        {/* kropla */}
        <path d="M60 142 q-5 6 0 8 q5 -2 0 -8 z" fill="#e3ac3f" />
      </svg>
      <span className="wyscig-linia" />
    </div>
  );
}
