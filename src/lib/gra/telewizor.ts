// Czy strona działa w przeglądarce telewizora (Samsung Tizen, LG webOS, Hisense VIDAA, Fire TV…). Na telewizorze
// wideo z trybem mieszania `screen` gra dźwięk, ale obrazu nie widać (sprzętowa warstwa wideo, 25–26.10 na OLED
// Łukasza), więc pijany finał wybucha tam bez wideo (ekran/_ekran/pijany.tsx). `?tv` w adresie wymusza wersję
// telewizorową na komputerze (do testów).
export function czyTelewizor(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/[?&]tv\b/.test(window.location.search)) return true;
  return /SMART-TV|SmartTV|Tizen|Web0S|webOS|HbbTV|BRAVIA|NetCast|VIDAA|AFT/i.test(navigator.userAgent);
}
