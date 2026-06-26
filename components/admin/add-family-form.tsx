"use client";

import { useActionState } from "react";
import {
  createFamilyAction,
  type FamilyActionState,
} from "@/lib/actions/families";
import { ActionMessage } from "@/components/action-message";
import { SubmitButton } from "@/components/submit-button";

const initialFamilyActionState: FamilyActionState = {
  ok: false,
  message: "",
};

export function AddFamilyForm() {
  const [state, formAction] = useActionState(
    createFamilyAction,
    initialFamilyActionState,
  );

  return (
    <form action={formAction} className="panel-form">
      <label className="field">
        <span>Family name</span>
        <input name="familyName" placeholder="Nassar family" required />
      </label>

      <SubmitButton pendingLabel="Adding family...">Add family</SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}
