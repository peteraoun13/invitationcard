"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type ActionState,
  getActionErrorMessage,
  readRequiredString,
} from "@/lib/validation";

export type LoginActionState = ActionState;

export async function signInAdminAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    const email = readRequiredString(formData, "email");
    const password = readRequiredString(formData, "password");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        ok: false,
        message: "The email or password is incorrect.",
      };
    }
  } catch (error) {
    return {
      ok: false,
      message: getActionErrorMessage(error),
    };
  }

  redirect("/admin");
}

export async function signOutAdminAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
