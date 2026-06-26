"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  type ActionState,
  getActionErrorMessage,
  readRequiredString,
} from "@/lib/validation";

export type GuestActionState = ActionState;

export async function createGuestAction(
  _previousState: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminUser();

  try {
    const familyId = readRequiredString(formData, "familyId");
    const guestName = readRequiredString(formData, "guestName");
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("guests").insert({
      family_id: familyId,
      guest_name: guestName,
      attending: null,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/families/${familyId}`);

    return {
      ok: true,
      message: "Guest added.",
    };
  } catch (error) {
    return {
      ok: false,
      message: getActionErrorMessage(error),
    };
  }
}

export async function updateGuestAction(formData: FormData) {
  await requireAdminUser();

  const familyId = readRequiredString(formData, "familyId");
  const guestId = readRequiredString(formData, "guestId");
  const guestName = readRequiredString(formData, "guestName");
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("guests")
    .update({ guest_name: guestName })
    .eq("id", guestId)
    .eq("family_id", familyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/families/${familyId}`);
}

export async function deleteGuestAction(formData: FormData) {
  await requireAdminUser();

  const familyId = readRequiredString(formData, "familyId");
  const guestId = readRequiredString(formData, "guestId");
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId)
    .eq("family_id", familyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/families/${familyId}`);
}
