"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";
import { getPrimaryWedding } from "@/lib/data/weddings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createInviteToken } from "@/lib/tokens";
import {
  type ActionState,
  getActionErrorMessage,
  readRequiredString,
} from "@/lib/validation";

export type FamilyActionState = ActionState;

async function createUniqueInviteToken(familyName: string) {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = createInviteToken(familyName);
    const { data, error } = await supabase
      .from("families")
      .select("id")
      .eq("invite_token", token)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return token;
    }
  }

  throw new Error("Could not create a unique invite token. Please try again.");
}

export async function createFamilyAction(
  _previousState: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  await requireAdminUser();

  try {
    const familyName = readRequiredString(formData, "familyName");
    const wedding = await getPrimaryWedding();
    const inviteToken = await createUniqueInviteToken(familyName);
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("families").insert({
      wedding_id: wedding.id,
      family_name: familyName,
      invite_token: inviteToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");

    return {
      ok: true,
      message: "Family added and private invite link generated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: getActionErrorMessage(error),
    };
  }
}

export async function updateFamilyAction(formData: FormData) {
  await requireAdminUser();

  const familyId = readRequiredString(formData, "familyId");
  const familyName = readRequiredString(formData, "familyName");
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("families")
    .update({ family_name: familyName })
    .eq("id", familyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/families/${familyId}`);
}

export async function deleteFamilyAction(formData: FormData) {
  await requireAdminUser();

  const familyId = readRequiredString(formData, "familyId");
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("families").delete().eq("id", familyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function regenerateFamilyTokenAction(formData: FormData) {
  await requireAdminUser();

  const familyId = readRequiredString(formData, "familyId");
  const familyName = readRequiredString(formData, "familyName");
  const inviteToken = await createUniqueInviteToken(familyName);
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("families")
    .update({ invite_token: inviteToken })
    .eq("id", familyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/families/${familyId}`);
}
