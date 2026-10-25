// Uzupełnienia dla starszych przeglądarek telewizorów (Samsung od 2020 = Chromium 69). Next 16 kompiluje składnię
// pod `browserslist` z package.json (chrome 69), ale funkcji, których stara przeglądarka nie ma, sam nie dodaje.
// Skrypt jest w czystym ES5 i stoi na początku <head> (app/layout.tsx), więc wykonuje się przed całym kodem Next.
// Lista z przeglądu zbudowanych plików (25.10): `motion` woła `queueMicrotask` od razu przy wczytaniu i bez niego
// cały ekran zostawał czarny. Każde uzupełnienie dodaje się tylko wtedy, gdy przeglądarka danej funkcji nie ma.

export const POLYFILLE = `(function () {
  var g = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : window;
  function dodaj(cel, nazwa, wartosc) {
    if (!(nazwa in cel)) Object.defineProperty(cel, nazwa, { value: wartosc, writable: true, configurable: true });
  }
  if (typeof globalThis === "undefined") g.globalThis = g;
  dodaj(g, "queueMicrotask", function (f) {
    Promise.resolve().then(f)["catch"](function (e) {
      setTimeout(function () { throw e; });
    });
  });
  function at(n) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    return n < 0 || n >= this.length ? undefined : this[n];
  }
  dodaj(Array.prototype, "at", at);
  dodaj(String.prototype, "at", at);
  if (typeof Int8Array !== "undefined") dodaj(Object.getPrototypeOf(Int8Array.prototype), "at", at);
  dodaj(Object, "hasOwn", function (o, k) {
    return Object.prototype.hasOwnProperty.call(o, k);
  });
  dodaj(Object, "fromEntries", function (lista) {
    var o = {};
    Array.from(lista, function (p) { o[p[0]] = p[1]; });
    return o;
  });
  dodaj(String.prototype, "replaceAll", function (szukane, na) {
    if (szukane instanceof RegExp) return this.replace(szukane, na);
    return this.replace(new RegExp(String(szukane).replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&"), "g"), na);
  });
  dodaj(String.prototype, "matchAll", function (wzor) {
    var r = new RegExp(wzor, wzor instanceof RegExp ? (wzor.flags.indexOf("g") < 0 ? wzor.flags + "g" : wzor.flags) : "g");
    var wyniki = [], m;
    while ((m = r.exec(this)) !== null) {
      wyniki.push(m);
      if (m[0] === "") r.lastIndex++;
    }
    return wyniki[Symbol.iterator]();
  });
  dodaj(Promise, "allSettled", function (lista) {
    return Promise.all(Array.from(lista, function (p) {
      return Promise.resolve(p).then(
        function (v) { return { status: "fulfilled", value: v }; },
        function (e) { return { status: "rejected", reason: e }; }
      );
    }));
  });
})();`;
