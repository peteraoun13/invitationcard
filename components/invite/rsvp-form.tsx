"use client";

import { useActionState } from "react";
import {
  type RsvpActionState,
} from "@/lib/actions/rsvp";
import { ActionMessage } from "@/components/action-message";
import { SubmitButton } from "@/components/submit-button";

const initialRsvpActionState: RsvpActionState = {
  ok: false,
  message: "",
};

type RsvpGuest = {
  id: string;
  guest_name: string;
  attending: boolean | null;
};

type RsvpFormProps = {
  guests: RsvpGuest[];
  action: (
    previousState: RsvpActionState,
    formData: FormData,
  ) => Promise<RsvpActionState>;
};

export function RsvpForm({ guests, action }: RsvpFormProps) {
  const [state, formAction] = useActionState(action, initialRsvpActionState);

  if (state.ok) {
    return (
      <div className="invite-confirmation" role="status">
        <p className="eyebrow">RSVP received</p>
        <h2>Thank you.</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rsvp-form">
      <div className="guest-choice-list">
        {guests.map((guest) => (
          <label className="guest-choice" key={guest.id}>
            <input
              type="checkbox"
              name="guestIds"
              value={guest.id}
              defaultChecked={guest.attending === true}
            />
            <span>{guest.guest_name}</span>
          </label>
        ))}
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea name="notes" placeholder="Optional message" rows={4} />
      </label>

      <SubmitButton pendingLabel="Sending RSVP...">Submit RSVP</SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}
