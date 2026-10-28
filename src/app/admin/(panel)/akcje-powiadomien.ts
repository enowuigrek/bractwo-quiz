"use server";

import { refresh } from "next/cache";
import { widziWszystko, wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";

/** „OK” pod powiadomieniami: wszystkie nieprzeczytane znikają z panelu (zostają w bazie). */
export async function przeczytajPowiadomienia(): Promise<void> {
  if (!widziWszystko(await wymagajAdmina())) return;
  await supabaseAdmin().from("powiadomienia").update({ przeczytane: new Date().toISOString() }).is("przeczytane", null);
  refresh();
}
