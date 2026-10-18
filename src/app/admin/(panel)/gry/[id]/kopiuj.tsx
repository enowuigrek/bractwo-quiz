"use client";

import { useState } from "react";

/** Link z przyciskiem „Kopiuj” (np. do wysłania prowadzącemu). */
export function LinkDoSkopiowania({ url }: { url: string }) {
  const [skopiowano, setSkopiowano] = useState(false);
  return (
    <div className="link-kopiuj">
      <code>{url}</code>
      <button
        type="button"
        className="przycisk-maly"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setSkopiowano(true);
          setTimeout(() => setSkopiowano(false), 2000);
        }}
      >
        {skopiowano ? "Skopiowano" : "Kopiuj"}
      </button>
    </div>
  );
}
