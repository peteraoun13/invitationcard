"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  className = "",
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`button button--${variant} ${className}`.trim()}
      disabled={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
