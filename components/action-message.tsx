import type { ActionState } from "@/lib/validation";

type ActionMessageProps = {
  state: ActionState;
};

export function ActionMessage({ state }: ActionMessageProps) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={`action-message ${state.ok ? "is-success" : "is-error"}`}>
      {state.message}
    </p>
  );
}
