import { wymagajAdmina } from "@/lib/admin";
import { NaglowekPanelu } from "./_komponenty/naglowek-panelu";
import { Powiadomienia } from "./_komponenty/powiadomienia";
import "./panel.css";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const rola = await wymagajAdmina();
  return (
    <div className="panel">
      <NaglowekPanelu rola={rola} />
      <Powiadomienia rola={rola} />
      {children}
    </div>
  );
}
