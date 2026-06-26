"use client";

import { useState } from "react";
import InvitationCard from "@/src/components/InvitationCard.jsx";
import { invitationContent } from "@/src/data/invitationContent.js";
import type { RsvpActionState } from "@/lib/actions/rsvp";

type InviteGuest = {
  id: string;
  guest_name: string;
  attending: boolean | null;
};

type RealInvitationCardProps = {
  guests: InviteGuest[];
  hideRsvp?: boolean;
  submitRsvpAction: (
    previousState: RsvpActionState,
    formData: FormData,
  ) => Promise<RsvpActionState>;
};

export function RealInvitationCard({
  guests,
  hideRsvp = false,
  submitRsvpAction,
}: RealInvitationCardProps) {
  const [language, setLanguage] = useState(invitationContent.defaultLanguage);
  const [isRsvpHidden, setIsRsvpHidden] = useState(hideRsvp);

  function toggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "fr" : "en"));
  }

  return (
    <InvitationCard
      language={language}
      onToggleLanguage={toggleLanguage}
      rsvpGuests={guests}
      hideRsvp={isRsvpHidden}
      onRsvpSubmitted={() => setIsRsvpHidden(true)}
      submitRsvpAction={submitRsvpAction}
    />
  );
}
