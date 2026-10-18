/* eslint-disable @next/next/no-img-element -- grafiki z bucketu Supabase (także SVG), bez optymalizacji next/image */

export function Miniatura({ src, alt }: { src: string | null; alt: string }) {
  return src ? <img src={src} alt={alt} className="miniatura" /> : <span className="miniatura-pusta" aria-hidden />;
}

type PoleGrafikiProps = {
  /** Nazwa pola z plikiem. Pole „usuń” ma nazwę `${nazwa}_usun`. */
  nazwa: string;
  etykieta: string;
  obecna?: string | null;
  podpowiedz?: string;
};

/** Wybór grafiki z podglądem obecnej i opcją jej usunięcia. */
export function PoleGrafiki({ nazwa, etykieta, obecna, podpowiedz }: PoleGrafikiProps) {
  return (
    <div>
      <label htmlFor={nazwa}>{etykieta}</label>
      {obecna && (
        <div className="podglad-grafiki">
          <img src={obecna} alt="" />
          <label className="przelacznik">
            <input type="checkbox" name={`${nazwa}_usun`} /> usuń
          </label>
        </div>
      )}
      <input
        id={nazwa}
        name={nazwa}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="pole-plik"
      />
      <p className="podpowiedz">{podpowiedz ?? "PNG, JPG, WebP albo SVG, do 5 MB."}</p>
    </div>
  );
}
