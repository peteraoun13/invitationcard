import { useEffect, useMemo, useState } from "react";
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

function BackgroundMedia({ assets }) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = Boolean(assets.coverVideo) && !videoFailed;
  const posterStyle = assets.coverPhoto
    ? { "--video-poster-image": `url("${assets.coverPhoto}")` }
    : undefined;

  function playVideo(event) {
    const video = event.currentTarget;
    video.play().catch(() => {
      // The poster remains visible if mobile autoplay is blocked.
    });
  }

  function handleVideoReady(event) {
    setVideoReady(true);
    playVideo(event);
  }

  return (
    <>
      <div className="video-poster-bg" style={posterStyle} aria-hidden="true" />

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
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
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

function HeroSection({ couple }) {
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
        <span className="video-scroll-label">Scroll to continue</span>
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
          {invitation.verse.map((line) => (
            <span
              className={line.includes("Corinthians") ? "video-verse-citation" : ""}
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

function EventSection({ event }) {
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
          <span>View Location</span>
        </a>
      </div>
    </StorySection>
  );
}

function CeremonySection({ ceremony }) {
  return <EventSection event={ceremony} />;
}

function PartySection({ party }) {
  return <EventSection event={party} />;
}

function GiftRegistrySection({ giftRegistry }) {
  return (
    <StorySection>
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

function RsvpSection({ couple, rsvp }) {
  const [selectedGuests, setSelectedGuests] = useState([]);
  const rsvpHref = `mailto:${rsvp.email}?subject=Wedding RSVP - ${
    couple.names
  }&body=${encodeURIComponent(
    `Hello,\n\nWe confirm our presence for:\n${selectedGuests
      .map((name) => `- ${name}`)
      .join("\n")}\n\nThank you.`,
  )}`;

  function toggleGuest(guest) {
    setSelectedGuests((current) =>
      current.includes(guest)
        ? current.filter((name) => name !== guest)
        : [...current, guest],
    );
  }

  return (
    <StorySection showScrollCue={false}>
      <div className="section-card rsvp-card">
        <p className="event-eyebrow">{rsvp.eyebrow}</p>
        <h2 className="rsvp-title">{rsvp.title}</h2>
        <span className="event-rule" aria-hidden="true" />
        <p className="rsvp-line">{rsvp.line}</p>

        <div className="guest-list" aria-label="Guest names">
          {rsvp.guests.map((guest) => {
            const isSelected = selectedGuests.includes(guest);

            return (
              <button
                type="button"
                className={`guest-row ${isSelected ? "is-selected" : ""}`}
                onClick={() => toggleGuest(guest)}
                key={guest}
              >
                <span className="guest-square" aria-hidden="true" />
                <span>{guest}</span>
              </button>
            );
          })}
        </div>

        <a
          className={`event-button rsvp-reserve ${
            selectedGuests.length === 0 ? "is-disabled" : ""
          }`}
          href={selectedGuests.length > 0 ? rsvpHref : undefined}
          aria-disabled={selectedGuests.length === 0}
        >
          <span>{rsvp.buttonLabel}</span>
        </a>
      </div>
    </StorySection>
  );
}

function PanelCountdown({ countdown, remaining }) {
  const readableCountdown = countdownUnits
    .map(([key, label]) => `${remaining[key]} ${label.toLowerCase()}`)
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
            <span>{label[0]}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

function StoryProgress({ activeIndex }) {
  return (
    <div className="video-story-progress" aria-hidden="true">
      {Array.from({ length: storyPanelCount }, (_, index) => (
        <span className={index === activeIndex ? "is-active" : ""} key={index} />
      ))}
    </div>
  );
}

export default function InvitationCard() {
  const {
    assets,
    couple,
    invitation,
    ceremony,
    party,
    giftRegistry,
    rsvp,
    countdown,
  } = invitationContent;
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const remaining = useCountdown(countdown.target);

  function handleStoryScroll(event) {
    const { scrollTop, clientHeight } = event.currentTarget;
    const nextIndex = Math.min(
      storyPanelCount - 1,
      Math.max(0, Math.round(scrollTop / clientHeight)),
    );

    setActivePanelIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex,
    );
  }

  return (
    <div className="invitation-page video-invite-page">
      <BackgroundMedia assets={assets} />

      <motion.div
        className="site-reveal-wash"
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{
          opacity: 0,
          transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        }}
      />

      <div className="story-scroll" onScroll={handleStoryScroll}>
        <HeroSection couple={couple} />
        <VerseSection invitation={invitation} />
        <InvitationSection couple={couple} invitation={invitation} />
        <CeremonySection ceremony={ceremony} />
        <PartySection party={party} />
        <GiftRegistrySection giftRegistry={giftRegistry} />
        <RsvpSection couple={couple} rsvp={rsvp} />
      </div>

      {activePanelIndex > 0 && (
        <PanelCountdown countdown={countdown} remaining={remaining} />
      )}
      <StoryProgress activeIndex={activePanelIndex} />
    </div>
  );
}
