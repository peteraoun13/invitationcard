import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Wedding } from "@/types/database";

const DEFAULT_WEDDING = {
  bride_name: "Hala",
  groom_name: "Jad",
  wedding_date: "2026-08-08T18:00:00+03:00",
};

export async function getPrimaryWedding(): Promise<Wedding> {
  const supabase = createSupabaseAdminClient();

  const { data: existingWedding, error: readError } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (existingWedding) {
    return existingWedding;
  }

  const { data: createdWedding, error: createError } = await supabase
    .from("weddings")
    .insert(DEFAULT_WEDDING)
    .select("*")
    .single();

  if (createError || !createdWedding) {
    throw new Error(createError?.message || "Could not create wedding record.");
  }

  return createdWedding;
}
