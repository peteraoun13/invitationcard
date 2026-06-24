import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

const countdownUnits = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

const storyPanelCount = 8;

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

export default function InvitationCard() {
  const { assets, couple, wedding } = invitationContent;
  const videoRef = useRef(null);
  const scrollRef = useRef(null);
  const weddingDate = useMemo(
    () => new Date(wedding.countdownTarget),
    [wedding.countdownTarget],
  );
  const [remaining, setRemaining] = useState(() => getRemainingTime(weddingDate));
  const [videoFailed, setVideoFailed] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
const [selectedGuests, setSelectedGuests] = useState([]);

function toggleGuest(guest) {
  setSelectedGuests((current) =>
    current.includes(guest)
      ? current.filter((name) => name !== guest)
      : [...current, guest],
  );
}

const rsvpHref = `mailto:rsvp@example.com?subject=Wedding RSVP - ${couple.names}&body=${encodeURIComponent(
  `Hello,\n\nWe confirm our presence for:\n${selectedGuests
    .map((name) => `- ${name}`)
    .join("\n")}\n\nThank you.`,
)}`;
  const hasVideo = Boolean(assets.coverVideo) && !videoFailed;

  useEffect(() => {
    const tick = () => setRemaining(getRemainingTime(weddingDate));
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [weddingDate]);

  function playCoverVideo() {
    const video = videoRef.current;

    if (!video) return;

    video.play().catch(() => {
      // Muted inline video is expected to autoplay; if not, text remains readable.
    });
  }

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
      {hasVideo ? (
        <video
          ref={videoRef}
          className="video-invite-bg"
          src={assets.coverVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          onLoadedData={playCoverVideo}
          onCanPlay={playCoverVideo}
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div className="video-invite-fallback" aria-hidden="true" />
      )}

      <div className="video-invite-overlay" aria-hidden="true" />

      <motion.div
        className="site-reveal-wash"
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{
          opacity: 0,
          transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        }}
      />

      <div
        className="video-invite-scroll"
        onScroll={handleStoryScroll}
        ref={scrollRef}
      >
        <section className="video-invite-panel video-invite-hero">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.18, duration: 1, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <h1>{couple.names}</h1>
            <p className="video-invite-date">{wedding.shortDate}</p>
          </motion.div>
          <div className="video-scroll-cue" aria-hidden="true">
            <span className="video-scroll-label">Scroll to continue</span>
            <span className="video-scroll-line">
              <span className="video-scroll-dot" />
            </span>
          </div>
        </section>

        <motion.section
  className="video-invite-panel video-copy-panel video-verse-panel"
  initial={{ opacity: 0, y: 22 }}
  whileInView={{
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  }}
  viewport={{ once: true, amount: 0.28 }}
>
  <div className="video-ceremony-card video-verse-card">
    <p className="video-verse">
      {wedding.invitationVerse.map((line) => (
        <span
          className={line.includes("Corinthians") ? "video-verse-citation" : ""}
          key={line}
        >
          {line}
        </span>
      ))}
    </p>
  </div>
</motion.section>

<motion.section
  className="video-invite-panel video-copy-panel video-family-panel"
  initial={{ opacity: 0, y: 22 }}
  whileInView={{
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  }}
  viewport={{ once: true, amount: 0.28 }}
>
  <div className="video-copy-stack video-reference-copy video-invitation-copy">
    <p className="video-blessing-lines">
      {wedding.gratitudeLines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </p>

    <span className="video-mini-rule" aria-hidden="true" />

    <p className="video-family-names-group">
      <span className="video-small-line">{wedding.familyIntro}</span>
      <span className="video-family-name">{wedding.primaryFamilyName}</span>
      <span className="video-small-line">{wedding.togetherWith}</span>
      <span className="video-family-name">{wedding.secondaryFamilyName}</span>
    </p>

    <p className="video-invite-lines video-request-copy">
      {wedding.requestLines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </p>

    <p className="video-signature-line video-couple-signature">
      {couple.names}
    </p>

    <p className="video-celebration-date">{wedding.celebrationDate}</p>
  </div>
</motion.section>
        <motion.section
  className="video-invite-panel video-ceremony-panel"
  initial={{ opacity: 0, y: 22 }}
  whileInView={{
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  }}
  viewport={{ once: true, amount: 0.32 }}
>
  <div className="video-ceremony-card">
    <p className="video-ceremony-kicker">The</p>

    <h2 className="video-ceremony-title">
      {wedding.ceremonyTitle}
    </h2>

    <span className="video-ceremony-rule" aria-hidden="true" />

    <p className="video-ceremony-time">
      {wedding.ceremonyTime}
    </p>

    <p className="video-ceremony-zone">
      {wedding.ceremonyTimezone}
    </p>

    <p className="video-ceremony-place">
      {wedding.ceremonyPlace}
    </p>

    <a
      className="video-ceremony-button"
      href={wedding.ceremonyLocationUrl}
      target="_blank"
      rel="noreferrer"
    >
      <span className="location-pin" aria-hidden="true" />
      <span>View Location</span>
    </a>
  </div>
</motion.section>
<motion.section
  className="video-invite-panel video-ceremony-panel"
  initial={{ opacity: 0, y: 22 }}
  whileInView={{
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  }}
  viewport={{ once: true, amount: 0.32 }}
>
  <div className="video-ceremony-card">
    <p className="video-ceremony-kicker">The</p>

   <h2 className="video-ceremony-title">
  {wedding.partyTitle.map((line) => (
    <span key={line}>{line}</span>
  ))}
</h2>

    <span className="video-ceremony-rule" aria-hidden="true" />

    <p className="video-ceremony-time">
      {wedding.partyTime}
    </p>

    <p className="video-ceremony-zone">
      {wedding.partyTimezone}
    </p>

    <p className="video-ceremony-place">
      {wedding.partyPlace}
    </p>

    <a
      className="video-ceremony-button"
      href={wedding.partyLocationUrl}
      target="_blank"
      rel="noreferrer"
    >
      <span className="location-pin" aria-hidden="true" />
      <span>View Location</span>
    </a>
  </div>
</motion.section>

        <motion.section
          className="video-invite-panel video-gift-panel"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          }}
          viewport={{ once: true, amount: 0.32 }}
        >
         <div className="video-ceremony-card video-gift-card">
  <p className="video-ceremony-kicker">The</p>

  <h2 className="video-ceremony-title">
    {wedding.giftTitle.map((line) => (
      <span key={line}>{line}</span>
    ))}
  </h2>

  <span className="video-ceremony-rule" aria-hidden="true" />

  <div className="video-gift-copy">
    {wedding.giftRegistryLines.map((line, index) => (
      <p
        className={index === wedding.giftRegistryLines.length - 1 ? "video-gift-contact" : ""}
        key={line}
      >
        {line}
      </p>
    ))}
  </div>
</div>
        </motion.section>

  <motion.section
  className="video-invite-panel video-rsvp-panel"
  initial={{ opacity: 0, y: 22 }}
  whileInView={{
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  }}
  viewport={{ once: true, amount: 0.32 }}
>
  <div className="video-ceremony-card video-rsvp-card">
    <p className="video-ceremony-kicker">Kindly</p>

    <h2 className="video-rsvp-title-single">
      {wedding.rsvpTitle}
    </h2>

    <span className="video-ceremony-rule" aria-hidden="true" />

    <p className="video-rsvp-line">
      {wedding.rsvpLine}
    </p>

    <div className="video-guest-list" aria-label="Guest names">
      {wedding.guests.map((guest) => {
        const isSelected = selectedGuests.includes(guest);

        return (
          <button
            type="button"
            className={`video-guest-row ${isSelected ? "is-selected" : ""}`}
            onClick={() => toggleGuest(guest)}
            key={guest}
          >
            <span className="video-guest-square" aria-hidden="true" />
            <span>{guest}</span>
          </button>
        );
      })}
    </div>

    <a
      className={`video-ceremony-button video-rsvp-reserve ${
        selectedGuests.length === 0 ? "is-disabled" : ""
      }`}
      href={selectedGuests.length > 0 ? rsvpHref : undefined}
      aria-disabled={selectedGuests.length === 0}
    >
      <span>{wedding.rsvpButtonLabel}</span>
    </a>
  </div>
</motion.section>
        <motion.section
          className="video-invite-panel video-countdown-panel"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          }}
          viewport={{ once: true, amount: 0.32 }}
        >
          <p className="video-countdown-heading">{wedding.countdownLabel}</p>
          <div className="video-countdown-grid">
            {countdownUnits.map(([key, label]) => (
              <div className="video-countdown-item" key={key}>
                <strong>{formatCountdownValue(remaining[key])}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="video-story-progress" aria-hidden="true">
        {Array.from({ length: storyPanelCount }, (_, index) => (
          <span
            className={index === activePanelIndex ? "is-active" : ""}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
