"use client";

import { useState } from "react";

type CopyInviteButtonProps = {
  inviteLink: string;
};

export function CopyInviteButton({ inviteLink }: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyInviteLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className="button button--secondary"
      onClick={copyInviteLink}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
