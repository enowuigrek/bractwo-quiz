/* eslint-disable @next/next/no-img-element -- logo z /public, skalowane CSS-em na scenie 1920×1080 */

/**
 * Logo Bractwa po prawej w nagłówku ekranów gry. Wcześniej stało w prawym dolnym rogu sceny
 * i zasłaniało podpisy (np. nagrodę pod szklanką w wyścigu).
 */
export function LogoNaglowka() {
  return <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo tv-logo-naglowek" />;
}
