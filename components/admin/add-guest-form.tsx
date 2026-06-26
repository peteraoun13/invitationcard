"use client";

import { useActionState } from "react";
import {
  createGuestAction,
  type GuestActionState,
} from "@/lib/actions/guests";
import { ActionMessage } from "@/components/action-message";
import { SubmitButton } from "@/components/submit-button";

const initialGuestActionState: GuestActionState = {
  ok: false,
  message: "",
};

type AddGuestFormProps = {
  familyId: string;
};

export function AddGuestForm({ familyId }: AddGuestFormProps) {
  const [state, formAction] = useActionState(
    createGuestAction,
    initialGuestActionState,
  );

  return (
    <form action={formAction} className="panel-form panel-form--inline">
      <input type="hidden" name="familyId" value={familyId} />
      <label className="field">
        <span>Guest name</span>
        <input name="guestName" placeholder="Guest full name" required />
      </label>

      <SubmitButton pendingLabel="Adding guest...">Add guest</SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}
