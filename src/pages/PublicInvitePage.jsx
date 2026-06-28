import { useCallback, useEffect, useMemo, useState } from "react";
import InvitationExperience from "../components/InvitationExperience.jsx";
import { getInviteByToken, submitFamilyRsvp } from "../services/backend";

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
      if (!invite) {
        return {
          ok: false,
          message: "This invitation could not be loaded. Please refresh and try again.",
        };
      }

      try {
        const responses = formData.getAll("guestResponses").map((value) => {
          if (typeof value !== "string") {
            throw new Error("Please answer Yes or No for every guest.");
          }

          const response = JSON.parse(value);

          if (
            !response ||
            typeof response.guestId !== "string" ||
            typeof response.attending !== "boolean"
          ) {
            throw new Error("Please answer Yes or No for every guest.");
          }

          return response;
        });
        const answeredGuestIds = new Set(responses.map((response) => response.guestId));

        if (
          responses.length !== invite.guests.length ||
          answeredGuestIds.size !== invite.guests.length ||
          invite.guests.some((guest) => !answeredGuestIds.has(guest.id))
        ) {
          throw new Error("Please answer Yes or No for every guest.");
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
          message: "Your response has been reserved.",
        };
      } catch (submitError) {
        return {
          ok: false,
          message: submitError.message || "Could not submit your RSVP. Please try again.",
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
