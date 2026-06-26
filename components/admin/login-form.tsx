"use client";

import { useActionState } from "react";
import {
  signInAdminAction,
  type LoginActionState,
} from "@/lib/actions/auth";
import { ActionMessage } from "@/components/action-message";
import { SubmitButton } from "@/components/submit-button";

const initialLoginState: LoginActionState = {
  ok: false,
  message: "",
};

export function LoginForm() {
  const [state, formAction] = useActionState(signInAdminAction, initialLoginState);

  return (
    <form action={formAction} className="auth-form">
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      <SubmitButton pendingLabel="Signing in...">Log in</SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}
