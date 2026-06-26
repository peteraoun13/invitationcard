import { getSiteUrl } from "@/lib/env";

export function createInviteLink(inviteToken: string) {
  return `${getSiteUrl()}/invite/${inviteToken}`;
}
