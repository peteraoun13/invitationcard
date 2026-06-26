import { signOutAdminAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export function SignOutForm() {
  return (
    <form action={signOutAdminAction}>
      <SubmitButton variant="ghost" pendingLabel="Signing out...">
        Sign out
      </SubmitButton>
    </form>
  );
}
