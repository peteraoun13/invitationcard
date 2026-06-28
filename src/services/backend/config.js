export const backendProvider = (
  import.meta.env.VITE_BACKEND_PROVIDER || "firebase"
).toLowerCase();

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

export const siteUrl = (
  import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin
).replace(/\/$/, "");

export function slugifyText(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "family";
}

export function getPublicInviteSlug(familyOrToken, familyName = "") {
  if (typeof familyOrToken === "object" && familyOrToken) {
    if (familyOrToken.publicSlug) {
      return familyOrToken.publicSlug;
    }

    const inviteToken = familyOrToken.inviteToken || familyOrToken.id || "";

    if (String(inviteToken).includes("-")) {
      return inviteToken;
    }

    return `${slugifyText(familyOrToken.familyName || familyName)}-${inviteToken}`;
  }

  const inviteToken = String(familyOrToken || "");

  if (inviteToken.includes("-")) {
    return inviteToken;
  }

  return `${slugifyText(familyName)}-${inviteToken}`;
}

export function buildInviteLink(familyOrToken, familyName = "") {
  return `${siteUrl}/invite/${getPublicInviteSlug(familyOrToken, familyName)}`;
}
