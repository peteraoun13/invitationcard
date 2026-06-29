import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EnvelopeIntro from "./EnvelopeIntro.jsx";
import InvitationCard from "./InvitationCard.jsx";
import { invitationContent } from "../data/invitationContent.js";

const audioModules = import.meta.glob(
  [
    "../assets/song1.mp3",
    "../assets/song1.m4a",
    "../assets/song1.ogg",
    "../assets/wedding-song.mp3",
    "../assets/background-music.mp3",
  ],
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

const initialAssetReadiness = {
  fontsReady: false,
  openingVideoReady: false,
  posterReady: false,
  invitationVideoMetadataReady: false,
  audioReady: false,
};

function getOptionalAudio(fileName) {
  return audioModules[`../assets/${fileName}`] ?? "";
}

const musicSources = {
  mp3:
    getOptionalAudio("song1.mp3") ||
    getOptionalAudio("wedding-song.mp3") ||
    getOptionalAudio("background-music.mp3"),
  m4a: getOptionalAudio("song1.m4a"),
  ogg: getOptionalAudio("song1.ogg"),
};

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function requestPortraitLock() {
  const orientation = window.screen?.orientation;

  if (typeof orientation?.lock !== "function") {
    return;
  }

  try {
    const lockRequest = orientation.lock("portrait-primary");
    lockRequest?.catch?.(() => {
      // Browser tabs may reject this; the landscape guard remains as a fallback.
    });
  } catch {
    // Installed apps allow this more consistently than ordinary browser tabs.
  }
}

function loadFonts() {
  if (!("fonts" in document)) {
    return Promise.resolve(true);
  }

  return Promise.allSettled([
    document.fonts.load('400 1em "The Signature Wedding"'),
    document.fonts.load('400 1em "Cormorant Garamond"'),
    document.fonts.load('500 1em "Cormorant Garamond"'),
    document.fonts.load('600 1em "Cormorant Garamond"'),
  ]).then(() => true);
}

function LuxuryPreloader() {
  return (
    <motion.div
      className="app-loading-screen"
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <div className="app-loading-screen__inner">
        <p className="app-loading-screen__mark">J &amp; H</p>
        <span className="app-loading-screen__rule" aria-hidden="true" />
        <p className="app-loading-screen__copy">Preparing your invitation</p>
      </div>
    </motion.div>
  );
}

export default function InvitationExperience({
  isInviteReady = true,
  rsvpGuests,
  hideRsvp = false,
  submitRsvpAction,
  rsvpSubmitted = false,
}) {
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isInvitationBackgroundReady, setIsInvitationBackgroundReady] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = window.sessionStorage.getItem("invitation-language");
      return savedLanguage === "fr" || savedLanguage === "en"
        ? savedLanguage
        : invitationContent.defaultLanguage;
    } catch {
      return invitationContent.defaultLanguage;
    }
  });
  const [isRsvpSubmitted, setIsRsvpSubmitted] = useState(rsvpSubmitted);
  const [assetReadiness, setAssetReadiness] = useState(initialAssetReadiness);
  const [minimumLoadingElapsed, setMinimumLoadingElapsed] = useState(false);
  const musicRef = useRef(null);
  const invitationVideoPreloadRef = useRef(null);
  const hasMusic = Boolean(musicSources.mp3 || musicSources.m4a || musicSources.ogg);

  useEffect(() => {
    setIsRsvpSubmitted(rsvpSubmitted);
  }, [rsvpSubmitted]);

  useEffect(() => {
    requestPortraitLock();
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("invitation-language", language);
    } catch {
      // Language selection still works when browser storage is unavailable.
    }
  }, [language]);

  useEffect(() => {
    let isMounted = true;
    function setReady(key, value = true) {
      if (!isMounted) {
        return;
      }

      setAssetReadiness((current) => ({
        ...current,
        [key]: value,
      }));
    }

    async function loadAssets() {
      await Promise.race([loadFonts(), wait(900)]);
      setReady("fontsReady");
    }

    wait(700).then(() => {
      if (isMounted) {
        setMinimumLoadingElapsed(true);
      }
    });

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isInitialLoading) {
      return;
    }

    if (
      isInviteReady &&
      minimumLoadingElapsed &&
      assetReadiness.openingVideoReady
    ) {
      setIsInitialLoading(false);
    }
  }, [
    assetReadiness.openingVideoReady,
    isInviteReady,
    isInitialLoading,
    minimumLoadingElapsed,
  ]);

  useEffect(() => {
    document.body.style.overflow = isInvitationOpen ? "auto" : "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isInvitationOpen]);

  function primeMusic() {
    requestPortraitLock();

    const music = musicRef.current;

    if (!music) return;

    try {
      music.muted = true;
      music.volume = 0;
      music.currentTime = 0;
    } catch {
      // The intro must stay smooth even if the browser blocks audio preparation.
    }
  }

  async function startMusic() {
    const music = musicRef.current;

    if (!music) return;

    try {
      music.volume = 0.68;
      music.currentTime = 0;
      music.muted = isMusicMuted;

      if (music.paused) {
        await music.play();
      }
    } catch {
      // If mobile blocks audio or the file is missing, the invitation still opens.
    }
  }

  function prepareInvitationMedia() {
    const videoSrc = invitationContent.assets.coverVideo;

    if (!videoSrc || invitationVideoPreloadRef.current) {
      return;
    }

    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "video";
    preloadLink.href = videoSrc;
    preloadLink.type = "video/mp4";
    preloadLink.fetchPriority = "low";
    document.head.appendChild(preloadLink);
    invitationVideoPreloadRef.current = preloadLink;
  }

  function toggleMusicMute() {
    const music = musicRef.current;
    const nextMuted = !isMusicMuted;

    setIsMusicMuted(nextMuted);

    if (!music) return;

    music.muted = nextMuted;

    if (!nextMuted && music.paused) {
      music.play().catch(() => {
        // Keep the button responsive even if the browser refuses playback.
      });
    }
  }

  function handleIntroComplete() {
    setIsInvitationBackgroundReady(false);
    setIsInvitationOpen(true);
  }

  function handleOpeningVideoReady() {
    setAssetReadiness((current) =>
      current.openingVideoReady
        ? current
        : {
            ...current,
            openingVideoReady: true,
          },
    );
  }

  function selectLanguage(nextLanguage) {
    if (nextLanguage === "en" || nextLanguage === "fr") {
      setLanguage(nextLanguage);
    }
  }

  function handleRsvpSubmitted() {
    setIsRsvpSubmitted(true);
  }

  return (
    <main className={isInvitationOpen ? "app app--scrollable" : "app"}>
      <AnimatePresence initial={false}>
        {!isInvitationOpen ? (
          <motion.section
            key="intro"
            className="screen-layer screen-layer--intro"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <EnvelopeIntro
              onComplete={handleIntroComplete}
              onOpeningVideoReady={handleOpeningVideoReady}
              onPrepareInvitationMedia={prepareInvitationMedia}
              onPrimeMusic={primeMusic}
              onStartMusic={startMusic}
            />
          </motion.section>
        ) : (
          <motion.section
            key="invitation"
            className="screen-layer screen-layer--flow"
            initial={{ opacity: 1 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <InvitationCard
              language={language}
              onSelectLanguage={selectLanguage}
              onBackgroundReady={() => setIsInvitationBackgroundReady(true)}
              rsvpGuests={rsvpGuests}
              hideRsvp={hideRsvp}
              rsvpSubmitted={isRsvpSubmitted}
              onRsvpSubmitted={handleRsvpSubmitted}
              submitRsvpAction={submitRsvpAction}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {hasMusic && (
        <audio ref={musicRef} preload="none" loop>
          {/* The wedding song sources are configured near the top of this file. */}
          {musicSources.ogg && <source src={musicSources.ogg} type="audio/ogg" />}
          {musicSources.m4a && <source src={musicSources.m4a} type="audio/mp4" />}
          {musicSources.mp3 && <source src={musicSources.mp3} type="audio/mpeg" />}
        </audio>
      )}

      {isInvitationOpen && isInvitationBackgroundReady && hasMusic && (
        <motion.button
          type="button"
          className="music-toggle"
          aria-label={isMusicMuted ? "Unmute music" : "Mute music"}
          aria-pressed={isMusicMuted}
          onClick={toggleMusicMute}
          initial={{ opacity: 0, scale: 0.86, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="music-toggle__icon" aria-hidden="true">
            {isMusicMuted ? (
              <svg viewBox="0 0 24 24" role="img">
                <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                <path d="m17 9 4 4m0-4-4 4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" role="img">
                <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                <path d="M16 8.5a5 5 0 0 1 0 7" />
                <path d="M18.8 5.7a9 9 0 0 1 0 12.6" />
              </svg>
            )}
          </span>
        </motion.button>
      )}

      <div className="portrait-orientation-guard" role="status" aria-live="polite">
        <span className="portrait-orientation-guard__phone" aria-hidden="true" />
        <p>Please rotate your phone back to portrait.</p>
      </div>

      <AnimatePresence>
        {isInitialLoading && <LuxuryPreloader />}
      </AnimatePresence>
    </main>
  );
}
