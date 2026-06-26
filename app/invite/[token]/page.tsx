import { notFound } from "next/navigation";
import { RealInvitationCard } from "@/components/invite/real-invitation-card";
import { submitRsvpAction } from "@/lib/actions/rsvp";
import { getPublicInviteByToken } from "@/lib/data/invites";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const family = await getPublicInviteByToken(token);

  if (!family) {
    notFound();
  }

  const submitAction = submitRsvpAction.bind(null, family.invite_token);

  return (
    <RealInvitationCard
      guests={family.guests}
      hideRsvp={family.hasSubmittedRsvp}
      submitRsvpAction={submitAction}
    />
  );
}
