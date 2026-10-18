import { wymagajAdmina } from "@/lib/admin";
import { wylogujAdmina } from "../akcje";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await wymagajAdmina();

  return (
    <div className="kolumna" style={{ maxWidth: "var(--max-w-header)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--section-gap)",
        }}
      >
        <strong style={{ color: "var(--zloto)" }}>Bractwo Quiz · panel</strong>
        <form action={wylogujAdmina}>
          <button type="submit" className="przycisk" style={{ width: "auto", padding: "8px 14px", fontSize: "var(--fs-small)" }}>
            Wyloguj
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
