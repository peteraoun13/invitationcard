import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

const sectionMotion = {
  initial: { opacity: 0 },
  whileInView: {
    opacity: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
  viewport: { once: true, amount: 0.32 },
};

const countdownUnits = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

const storyPanelCount = 7;
const storyPanelCountWithoutRsvp = 6;

const initialRsvpActionState = {
  ok: false,
  message: "",
};

async function fallbackRsvpAction() {
  return initialRsvpActionState;
}

function getRemainingTime(targetDate) {
  const distance = Math.max(targetDate.getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(distance / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function formatCountdownValue(value) {
  return value < 100 ? String(value).padStart(2, "0") : String(value);
}

function useCountdown(target) {
  const targetDate = useMemo(() => new Date(target), [target]);
  const [remaining, setRemaining] = useState(() => getRemainingTime(targetDate));

  useEffect(() => {
    const tick = () => setRemaining(getRemainingTime(targetDate));
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  return remaining;
}
function StorySection({
  children,
  className = "",
  amount = 0.32,
  showScrollCue = true,
}) {
  return (
    <motion.section
      className={`video-invite-panel ${className}`.trim()}
      initial={sectionMotion.initial}
      whileInView={sectionMotion.whileInView}
      viewport={{ once: true, amount }}
    >
      {children}

      {showScrollCue && (
        <div className="video-scroll-cue" aria-hidden="true">
          <span className="video-scroll-line">
            <span className="video-scroll-dot" />
          </span>
        </div>
      )}
    </motion.section>
  );
}

function renderTitle(title) {
  return Array.isArray(title)
    ? title.map((line) => <span key={line}>{line}</span>)
    : title;
}

function BackgroundMedia({ assets, onPosterReady }) {
  const [previewReady, setPreviewReady] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const readyNotifiedRef = useRef(false);
  const hasVideoSource = Boolean(assets.coverVideo);
  const hasPoster = Boolean(assets.coverPreview || assets.coverPhoto);
  const hasVideo = hasVideoSource && !videoFailed;
  const hasAnyPosterReady = previewReady || posterReady;
  const posterStyle = {
    ...(assets.coverPreview
      ? { "--video-poster-preview": `url("${assets.coverPreview}")` }
      : {}),
    ...(assets.coverPhoto
      ? { "--video-poster-image": `url("${assets.coverPhoto}")` }
      : {}),
  };

  const notifyBackgroundReady = useCallback(() => {
    if (readyNotifiedRef.current) {
      return;
    }

    readyNotifiedRef.current = true;
    onPosterReady?.();
  }, [onPosterReady]);

  useEffect(() => {
    if (!hasPoster && !hasVideoSource) {
      notifyBackgroundReady();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      notifyBackgroundReady();
    }, 4600);

    return () => window.clearTimeout(timeoutId);
  }, [hasPoster, hasVideoSource, notifyBackgroundReady]);

  useEffect(() => {
    if (videoReady) {
      notifyBackgroundReady();
      return undefined;
    }

    if (hasAnyPosterReady && (!hasVideoSource || videoFailed)) {
      notifyBackgroundReady();
      return undefined;
    }

    if (hasAnyPosterReady && hasVideoSource && !videoFailed) {
      const posterFallbackTimeoutId = window.setTimeout(() => {
        notifyBackgroundReady();
      }, 1650);

      return () => window.clearTimeout(posterFallbackTimeoutId);
    }

    return undefined;
  }, [
    hasAnyPosterReady,
    hasVideoSource,
    notifyBackgroundReady,
    videoFailed,
    videoReady,
  ]);

  function handlePreviewReady() {
    if (previewReady) {
      return;
    }

    setPreviewReady(true);
  }

  function handlePosterReady() {
    if (posterReady) {
      return;
    }

    setPosterReady(true);
  }

  function playVideo(event) {
    const video = event.currentTarget;
    video.play().catch(() => {
      // The poster remains visible if mobile autoplay is blocked.
    });
  }

  function handleVideoCanPlay(event) {
    playVideo(event);
  }

  function handleVideoPlaying() {
    setVideoReady(true);
  }

  return (
    <>
      <div className="video-poster-bg" style={posterStyle} aria-hidden="true" />

      {assets.coverPreview && (
        <img
          className={`video-poster-preview ${previewReady ? "is-ready" : ""}`}
          src={assets.coverPreview}
          alt=""
          aria-hidden="true"
          draggable="false"
          decoding="async"
          fetchPriority="high"
          loading="eager"
          onLoad={handlePreviewReady}
          onError={handlePreviewReady}
        />
      )}

      {assets.coverPhoto && (
        <img
          className={`video-poster-img ${posterReady ? "is-ready" : ""}`}
          src={assets.coverPhoto}
          alt=""
          aria-hidden="true"
          draggable="false"
          decoding="async"
          fetchPriority="high"
          loading="eager"
          onLoad={handlePosterReady}
          onError={handlePosterReady}
        />
      )}

      {hasVideo && (
        <video
          className={`video-invite-bg ${videoReady ? "is-ready" : ""}`}
          src={assets.coverVideo}
          poster={assets.coverPhoto || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controls={false}
          onLoadedData={handleVideoCanPlay}
          onCanPlay={handleVideoCanPlay}
          onPlaying={handleVideoPlaying}
          onError={() => {
            setVideoReady(false);
            setVideoFailed(true);
          }}
        />
      )}

      <div className="video-invite-overlay" aria-hidden="true" />
    </>
  );
}

function LanguageToggle({ language, onToggleLanguage, label }) {
  return (
    <button
      type="button"
      className="language-toggle"
      dir="ltr"
      aria-label={label}
      onClick={onToggleLanguage}
    >
      <span className={language === "en" ? "is-active" : ""}>EN</span>
      <span aria-hidden="true">|</span>
      <span className={language === "fr" ? "is-active" : ""}>FR</span>
    </button>
  );
}

function HeroSection({ couple, ui }) {
  return (
    <section className="video-invite-panel video-invite-hero">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { delay: 0.18, duration: 1, ease: [0.22, 1, 0.36, 1] },
        }}
      >
        <h1>{couple.names}</h1>
      </motion.div>

      <div className="video-scroll-cue" aria-hidden="true">
        <span className="video-scroll-label">{ui.scrollLabel}</span>
        <span className="video-scroll-line">
          <span className="video-scroll-dot" />
        </span>
      </div>
    </section>
  );
}

function VerseSection({ invitation }) {
  return (
    <StorySection amount={0.28}>
      <div className="section-card video-verse-card">
        <p className="video-verse">
          {invitation.verse.map((line, index) => (
            <span
              className={
                index === invitation.verse.length - 1 ? "video-verse-citation" : ""
              }
              key={line}
            >
              {line}
            </span>
          ))}
        </p>
      </div>
    </StorySection>
  );
}

function InvitationSection({ couple, invitation }) {
  return (
    <StorySection amount={0.28}>
      <div className="video-copy-stack video-invitation-copy">
        <p className="video-blessing-lines">
          {invitation.gratitudeLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>

        <span className="video-mini-rule" aria-hidden="true" />

        <p className="video-family-names-group">
          <span className="video-small-line">{invitation.familyIntro}</span>
          <span className="video-family-name">{invitation.primaryFamilyName}</span>
          <span className="video-small-line">{invitation.togetherWith}</span>
          <span className="video-family-name">{invitation.secondaryFamilyName}</span>
        </p>

        <p className="video-invite-lines video-request-copy">
          {invitation.requestLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>

        <p className="video-couple-signature">{couple.names}</p>
        <p className="video-celebration-date">{invitation.celebrationDate}</p>
      </div>
    </StorySection>
  );
}

function EventSection({ event, ui }) {
  return (
    <StorySection>
      <div className="section-card event-card">
        <p className="event-eyebrow">{event.eyebrow}</p>
        <h2 className="event-title">{renderTitle(event.title)}</h2>
        <span className="event-rule" aria-hidden="true" />
        <p className="event-time">{event.time}</p>
        <p className="event-zone">{event.timezone}</p>
        <p className="event-place">{event.place}</p>

        <a
          className="event-button"
          href={event.locationUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="location-pin" aria-hidden="true" />
          <span>{ui.locationLabel}</span>
        </a>
      </div>
    </StorySection>
  );
}

function CeremonySection({ ceremony, ui }) {
  return <EventSection event={ceremony} ui={ui} />;
}

function PartySection({ party, ui }) {
  return <EventSection event={party} ui={ui} />;
}

function GiftRegistrySection({ giftRegistry, showScrollCue = true }) {
  return (
    <StorySection showScrollCue={showScrollCue}>
      <div className="section-card gift-card">
        <p className="event-eyebrow">{giftRegistry.eyebrow}</p>
        <h2 className="event-title">{renderTitle(giftRegistry.title)}</h2>
        <span className="event-rule" aria-hidden="true" />

        <div className="gift-copy">
          {giftRegistry.lines.map((line, index) => (
            <p
              className={index === giftRegistry.lines.length - 1 ? "gift-contact" : ""}
              key={line}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </StorySection>
  );
}

function RsvpSection({
  couple,
  rsvp,
  ui,
  rsvpGuests,
  rsvpSubmitted = false,
  submitRsvpAction,
  onRsvpSubmitted,
}) {
  const hasDynamicGuests = Array.isArray(rsvpGuests);
  const guests = useMemo(
    () =>
      hasDynamicGuests
        ? rsvpGuests.map((guest) => ({
            id: guest.id,
            name: guest.guest_name,
            attending: guest.attending,
          }))
        : rsvp.guests.map((guestName) => ({
            id: guestName,
            name: guestName,
            attending: null,
          })),
    [hasDynamicGuests, rsvp.guests, rsvpGuests],
  );
  const [selectedGuests, setSelectedGuests] = useState(() =>
    guests.filter((guest) => guest.attending === true).map((guest) => guest.id),
  );
  const [rsvpState, formAction] = useActionState(
    submitRsvpAction || fallbackRsvpAction,
    initialRsvpActionState,
  );
  const isDatabaseRsvp = Boolean(submitRsvpAction);
  const isSubmitted = rsvpSubmitted || rsvpState.ok;
  const selectedGuestNames = guests
    .filter((guest) => selectedGuests.includes(guest.id))
    .map((guest) => guest.name);
  const rsvpHref = `mailto:${rsvp.email}?subject=${ui.rsvpSubject} - ${
    couple.names
  }&body=${encodeURIComponent(
    `${ui.rsvpGreeting},\n\n${ui.rsvpBodyIntro}\n${selectedGuestNames
      .map((name) => `- ${name}`)
      .join("\n")}\n\n${ui.rsvpThanks}`,
  )}`;

  function toggleGuest(guestId) {
    if (isSubmitted) {
      return;
    }

    setSelectedGuests((current) =>
      current.includes(guestId)
        ? current.filter((currentGuestId) => currentGuestId !== guestId)
        : [...current, guestId],
    );
  }

  useEffect(() => {
    if (rsvpState.ok) {
      onRsvpSubmitted?.(rsvpState.message);
    }
  }, [onRsvpSubmitted, rsvpState.message, rsvpState.ok]);

  useEffect(() => {
    if (!rsvpSubmitted) {
      return;
    }

    setSelectedGuests(
      guests.filter((guest) => guest.attending === true).map((guest) => guest.id),
    );
  }, [guests, rsvpSubmitted]);

  return (
    <StorySection showScrollCue={false}>
      <form
        action={isDatabaseRsvp ? formAction : undefined}
        className="section-card rsvp-card"
      >
        <p className="event-eyebrow">{rsvp.eyebrow}</p>
        <h2 className="rsvp-title">{rsvp.title}</h2>
        <span className="event-rule" aria-hidden="true" />
        <p className="rsvp-line">{rsvp.line}</p>

        {selectedGuests.map((guestId) => (
          <input type="hidden" name="guestIds" value={guestId} key={guestId} />
        ))}

        <div className="guest-list" aria-label="Guest names">
          {guests.map((guest) => {
            const isSelected = selectedGuests.includes(guest.id);

            return (
              <button
                type="button"
                className={`guest-row ${isSelected ? "is-selected" : ""} ${
                  isSubmitted ? "is-locked" : ""
                }`}
                disabled={isSubmitted}
                onClick={() => toggleGuest(guest.id)}
                key={guest.id}
              >
                <span className="guest-square" aria-hidden="true" />
                <span>{guest.name}</span>
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className="rsvp-confirmation" role="status">
            <span className="rsvp-confirmation__rule" aria-hidden="true" />
            <p>With gratitude</p>
            <small>Your response has been reserved.</small>
          </div>
        )}

        {!isSubmitted && isDatabaseRsvp ? (
          <button type="submit" className="event-button rsvp-reserve">
            <span>{rsvp.buttonLabel}</span>
          </button>
        ) : null}

        {!isSubmitted && !isDatabaseRsvp ? (
          <a
            className={`event-button rsvp-reserve ${
              selectedGuests.length === 0 ? "is-disabled" : ""
            }`}
            href={selectedGuests.length > 0 ? rsvpHref : undefined}
            aria-disabled={selectedGuests.length === 0}
          >
            <span>{rsvp.buttonLabel}</span>
          </a>
        ) : null}

        {!rsvpState.ok && rsvpState.message && (
          <p className="rsvp-error" role="alert">
            {rsvpState.message}
          </p>
        )}
      </form>
    </StorySection>
  );
}

function PanelCountdown({ countdown, remaining }) {
  const readableCountdown = countdownUnits
    .map(([key]) => `${remaining[key]} ${countdown.ariaUnits[key]}`)
    .join(", ");

  return (
    <div
      className="panel-countdown"
      aria-label={`${countdown.label} ${readableCountdown}`}
    >
      <span className="panel-countdown__units">
        {countdownUnits.map(([key, label]) => (
          <span className="panel-countdown__unit" key={key}>
            <strong>{formatCountdownValue(remaining[key])}</strong>
            <span>{countdown.unitLabels[key] || label[0]}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

function StoryProgress({ activeIndex, panelCount }) {
  return (
    <div className="video-story-progress" aria-hidden="true">
      {Array.from({ length: panelCount }, (_, index) => (
        <span className={index === activeIndex ? "is-active" : ""} key={index} />
      ))}
    </div>
  );
}

export default function InvitationCard({
  language,
  onToggleLanguage,
  onBackgroundReady,
  rsvpGuests,
  hideRsvp = false,
  rsvpSubmitted = false,
  onRsvpSubmitted,
  submitRsvpAction,
}) {
  const { assets, languages, defaultLanguage } = invitationContent;
  const content = languages[language] || languages[defaultLanguage];
  const {
    ui,
    couple,
    invitation,
    ceremony,
    party,
    giftRegistry,
    rsvp,
    countdown,
  } = content;
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const panelCount = hideRsvp ? storyPanelCountWithoutRsvp : storyPanelCount;
  const remaining = useCountdown(countdown.target);
  const handleBackgroundReady = useCallback(() => {
    setBackgroundReady(true);
    onBackgroundReady?.();
  }, [onBackgroundReady]);

  useEffect(() => {
    setActivePanelIndex((currentIndex) =>
      Math.min(currentIndex, Math.max(0, panelCount - 1)),
    );
  }, [panelCount]);

  function handleStoryScroll(event) {
    const { scrollTop, clientHeight } = event.currentTarget;
    const nextIndex = Math.min(
      panelCount - 1,
      Math.max(0, Math.round(scrollTop / clientHeight)),
    );

    setActivePanelIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex,
    );
  }

  return (
    <div
      className={`invitation-page video-invite-page ${
        backgroundReady ? "is-background-ready" : ""
      }`}
      dir={content.dir}
      lang={language}
    >
      <BackgroundMedia
        assets={assets}
        onPosterReady={handleBackgroundReady}
      />

      <motion.div
        className="site-reveal-wash"
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{
          opacity: backgroundReady ? 0 : 1,
          transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
        }}
      />

      <div className="story-scroll" onScroll={handleStoryScroll}>
        <HeroSection couple={couple} ui={ui} />
        <VerseSection invitation={invitation} />
        <InvitationSection couple={couple} invitation={invitation} />
        <CeremonySection ceremony={ceremony} ui={ui} />
        <PartySection party={party} ui={ui} />
        <GiftRegistrySection giftRegistry={giftRegistry} showScrollCue={!hideRsvp} />
        {!hideRsvp && (
          <RsvpSection
            couple={couple}
            rsvp={rsvp}
            ui={ui}
            rsvpGuests={rsvpGuests}
            rsvpSubmitted={rsvpSubmitted}
            onRsvpSubmitted={onRsvpSubmitted}
            submitRsvpAction={submitRsvpAction}
          />
        )}
      </div>

      {activePanelIndex === 0 && (
        <LanguageToggle
          language={language}
          label={ui.languageLabel}
          onToggleLanguage={onToggleLanguage}
        />
      )}
      {activePanelIndex > 0 && (
        <PanelCountdown countdown={countdown} remaining={remaining} />
      )}
      <StoryProgress activeIndex={activePanelIndex} panelCount={panelCount} />
    </div>
  );
}
