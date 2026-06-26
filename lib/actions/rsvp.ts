"use server";

import {
  type ActionState,
  getActionErrorMessage,
  readOptionalString,
} from "@/lib/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RsvpActionState = ActionState & {
  submissionId?: string;
};

export async function submitRsvpAction(
  inviteToken: string,
  _previousState: RsvpActionState,
  formData: FormData,
): Promise<RsvpActionState> {
  try {
    const selectedGuestIds = formData
      .getAll("guestIds")
      .filter((value): value is string => typeof value === "string");
    const notes = readOptionalString(formData, "notes");
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("submit_family_rsvp", {
      p_invite_token: inviteToken,
      p_attending_guest_ids: selectedGuestIds,
      p_notes: notes || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      ok: true,
      message: "Thank you. Your RSVP has been received.",
      submissionId: data,
    };
  } catch (error) {
    return {
      ok: false,
      message: getActionErrorMessage(error),
    };
  }
}
