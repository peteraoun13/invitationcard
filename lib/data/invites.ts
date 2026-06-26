import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Family, Guest } from "@/types/database";

export type PublicInviteFamily = Pick<Family, "id" | "family_name" | "invite_token"> & {
  guests: Pick<Guest, "id" | "guest_name" | "attending" | "created_at">[];
  hasSubmittedRsvp: boolean;
};

type PublicInviteRow = Pick<Family, "id" | "family_name" | "invite_token"> & {
  guests: Pick<Guest, "id" | "guest_name" | "attending" | "created_at">[] | null;
};

export async function getPublicInviteByToken(
  inviteToken: string,
): Promise<PublicInviteFamily | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("families")
    .select("id, family_name, invite_token, guests(id, guest_name, attending, created_at)")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const family = data as PublicInviteRow;
  const { count, error: submissionsError } = await supabase
    .from("rsvp_submissions")
    .select("id", { count: "exact", head: true })
    .eq("family_id", family.id);

  if (submissionsError) {
    throw new Error(submissionsError.message);
  }

  return {
    id: family.id,
    family_name: family.family_name,
    invite_token: family.invite_token,
    guests: [...(family.guests || [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
    hasSubmittedRsvp: Boolean(count && count > 0),
  };
}
