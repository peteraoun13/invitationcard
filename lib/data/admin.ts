import { createInviteLink } from "@/lib/invite-links";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Family, Guest, RsvpSubmission } from "@/types/database";

export type GuestWithStatus = Pick<
  Guest,
  "id" | "family_id" | "guest_name" | "attending" | "created_at" | "updated_at"
>;

export type FamilyWithGuests = Pick<
  Family,
  "id" | "family_name" | "invite_token" | "created_at"
> & {
  guests: GuestWithStatus[];
  inviteLink: string;
};

export type DashboardStats = {
  totalFamilies: number;
  totalInvitedGuests: number;
  totalAttending: number;
  totalNotAttending: number;
  totalPending: number;
};

export type DashboardData = {
  stats: DashboardStats;
  families: FamilyWithGuests[];
};

type FamilyQueryRow = Pick<Family, "id" | "family_name" | "invite_token" | "created_at"> & {
  guests: GuestWithStatus[] | null;
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("families")
    .select(
      "id, family_name, invite_token, created_at, guests(id, family_id, guest_name, attending, created_at, updated_at)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const families = ((data || []) as FamilyQueryRow[]).map((family) => {
    const guests = [...(family.guests || [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );

    return {
      id: family.id,
      family_name: family.family_name,
      invite_token: family.invite_token,
      created_at: family.created_at,
      guests,
      inviteLink: createInviteLink(family.invite_token),
    };
  });

  const allGuests = families.flatMap((family) => family.guests);

  return {
    stats: {
      totalFamilies: families.length,
      totalInvitedGuests: allGuests.length,
      totalAttending: allGuests.filter((guest) => guest.attending === true).length,
      totalNotAttending: allGuests.filter((guest) => guest.attending === false).length,
      totalPending: allGuests.filter((guest) => guest.attending === null).length,
    },
    families,
  };
}

export type FamilyDetail = FamilyWithGuests & {
  submissions: Pick<RsvpSubmission, "id" | "submitted_at" | "notes">[];
};

type FamilyDetailQueryRow = FamilyQueryRow & {
  rsvp_submissions: Pick<RsvpSubmission, "id" | "submitted_at" | "notes">[] | null;
};

export async function getFamilyDetail(familyId: string): Promise<FamilyDetail | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("families")
    .select(
      "id, family_name, invite_token, created_at, guests(id, family_id, guest_name, attending, created_at, updated_at), rsvp_submissions(id, submitted_at, notes)",
    )
    .eq("id", familyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const family = data as FamilyDetailQueryRow;

  return {
    id: family.id,
    family_name: family.family_name,
    invite_token: family.invite_token,
    created_at: family.created_at,
    guests: [...(family.guests || [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
    submissions: [...(family.rsvp_submissions || [])].sort((a, b) =>
      b.submitted_at.localeCompare(a.submitted_at),
    ),
    inviteLink: createInviteLink(family.invite_token),
  };
}
