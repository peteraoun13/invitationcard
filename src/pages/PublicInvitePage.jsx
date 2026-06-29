import { useCallback, useEffect, useMemo, useState } from "react";
import InvitationExperience from "../components/InvitationExperience.jsx";
import { getInviteByToken, submitFamilyRsvp } from "../services/backend";

const rsvpMessages = {
  en: {
    invitationUnavailable: "This invitation could not be loaded. Please refresh and try again.",
    incomplete: "Please answer Yes or No for every guest.",
    success: "Your response has been received.",
    submitError: "Could not submit your RSVP. Please try again.",
  },
  fr: {
    invitationUnavailable:
      "Cette invitation n’a pas pu être chargée. Veuillez actualiser la page et réessayer.",
    incomplete: "Veuillez répondre Oui ou Non pour chaque invité.",
    success: "Votre réponse a bien été enregistrée.",
    submitError: "Impossible d’enregistrer votre réponse. Veuillez réessayer.",
  },
};

function PublicStatus({ title, message }) {
  return (
    <main className="public-status-page">
      <section className="public-status-card">
        <p className="admin-eyebrow">Wedding Invitation</p>
        <h1>{title}</h1>
        {message && <p>{message}</p>}
      </section>
    </main>
  );
}

export default function PublicInvitePage({ token }) {
  const [invite, setInvite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      setIsLoading(true);
      setError("");

      try {
        const nextInvite = await getInviteByToken(token);

        if (!isMounted) {
          return;
        }

        if (!nextInvite) {
          setInvite(null);
          setError("This private invitation link was not found.");
          return;
        }

        setInvite(nextInvite);
        setHasSubmitted(nextInvite.hasSubmittedRsvp);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInvite();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const rsvpGuests = useMemo(
    () =>
      invite?.guests.map((guest) => ({
        id: guest.id,
        guest_name: guest.name,
        attending: guest.attending,
      })) || [],
    [invite],
  );

  const submitRsvpAction = useCallback(
    async (_previousState, formData) => {
      const responseLanguage = formData.get("language") === "fr" ? "fr" : "en";
      const messages = rsvpMessages[responseLanguage];

      if (!invite) {
        return {
          ok: false,
          message: messages.invitationUnavailable,
        };
      }

      try {
        const responses = formData.getAll("guestResponses").map((value) => {
          if (typeof value !== "string") {
            throw new Error(messages.incomplete);
          }

          const response = JSON.parse(value);

          if (
            !response ||
            typeof response.guestId !== "string" ||
            typeof response.attending !== "boolean"
          ) {
            throw new Error(messages.incomplete);
          }

          return response;
        });
        const answeredGuestIds = new Set(responses.map((response) => response.guestId));

        if (
          responses.length !== invite.guests.length ||
          answeredGuestIds.size !== invite.guests.length ||
          invite.guests.some((guest) => !answeredGuestIds.has(guest.id))
        ) {
          throw new Error(messages.incomplete);
        }

        const result = await submitFamilyRsvp({
          familyId: invite.family.id,
          inviteToken: invite.family.inviteToken,
          guests: invite.guests,
          responses,
        });

        setInvite((currentInvite) =>
          currentInvite
            ? {
                ...currentInvite,
                hasSubmittedRsvp: true,
                guests: currentInvite.guests.map((guest) => {
                  const response = result.responses.find(
                    (guestResponse) => guestResponse.guestId === guest.id,
                  );

                  return response
                    ? {
                        ...guest,
                        attending: response.attending,
                        responded: true,
                      }
                    : guest;
                }),
              }
            : currentInvite,
        );
        setHasSubmitted(true);

        return {
          ok: true,
          message: messages.success,
        };
      } catch (submitError) {
        const isIncompleteResponse = submitError.message === messages.incomplete;

        return {
          ok: false,
          message: isIncompleteResponse
            ? messages.incomplete
            : responseLanguage === "fr"
              ? messages.submitError
              : submitError.message || messages.submitError,
        };
      }
    },
    [invite],
  );

  if (error) {
    return <PublicStatus title="Invitation unavailable" message={error} />;
  }

  if (!isLoading && !invite) {
    return (
      <PublicStatus
        title="Invitation unavailable"
        message="This private invitation link was not found."
      />
    );
  }

  return (
    <InvitationExperience
      isInviteReady={!isLoading && Boolean(invite)}
      rsvpGuests={rsvpGuests}
      rsvpSubmitted={hasSubmitted}
      submitRsvpAction={submitRsvpAction}
    />
  );
}
