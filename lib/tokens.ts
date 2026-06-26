import { randomBytes } from "node:crypto";

export function slugifyFamilyName(familyName: string) {
  const slug = familyName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34);

  return slug || "family";
}

export function createInviteToken(familyName: string) {
  const slug = slugifyFamilyName(familyName);
  const randomSuffix = randomBytes(6)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toLowerCase();

  return `${slug}-${randomSuffix}`;
}
