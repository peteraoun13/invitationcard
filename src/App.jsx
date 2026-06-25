import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EnvelopeIntro from "./components/EnvelopeIntro.jsx";
import InvitationCard from "./components/InvitationCard.jsx";
import { invitationContent } from "./data/invitationContent.js";

const audioModules = import.meta.glob(
  [
    // Put your song in src/assets/ and name it song.mp3 for the default setup.
    "./assets/song.mp3",
    "./assets/song.m4a",
    "./assets/song.ogg",
    "./assets/wedding-song.mp3",
    "./assets/background-music.mp3",
  ],
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

function getOptionalAudio(fileName) {
  return audioModules[`./assets/${fileName}`] ?? "";
}

const musicSources = {
  // Change the song file here if you want to use another asset name.
  mp3:
    getOptionalAudio("song.mp3") ||
    getOptionalAudio("wedding-song.mp3") ||
    getOptionalAudio("background-music.mp3"),
  m4a: getOptionalAudio("song.m4a"),
  ogg: getOptionalAudio("song.ogg"),
};

export default function App() {
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const musicRef = useRef(null);
  const hasMusic = Boolean(musicSources.mp3 || musicSources.m4a || musicSources.ogg);

  useEffect(() => {
    let isMounted = true;
    const minimumDelay = new Promise((resolve) => window.setTimeout(resolve, 520));
    const maximumDelay = new Promise((resolve) => window.setTimeout(resolve, 1700));

    const fontWarmup =
      "fonts" in document
        ? Promise.allSettled([
            document.fonts.load('400 1em "The Signature Wedding"'),
            document.fonts.load('400 1em "Cormorant Garamond"'),
            document.fonts.load('500 1em "Cormorant Garamond"'),
            document.fonts.load('600 1em "Cormorant Garamond"'),
          ])
        : Promise.resolve();

    Promise.race([
      Promise.allSettled([minimumDelay, fontWarmup]),
      maximumDelay,
    ]).then(() => {
      if (isMounted) {
        setIsInitialLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const { coverPhoto, coverVideo } = invitationContent.assets;
    const preloadLinks = [];

    if (coverPhoto) {
      const posterLink = document.createElement("link");
      posterLink.rel = "preload";
      posterLink.as = "image";
      posterLink.href = coverPhoto;
      document.head.appendChild(posterLink);
      preloadLinks.push(posterLink);
    }

    if (!coverVideo) {
      return () => {
        preloadLinks.forEach((link) => link.remove());
      };
    }

    // Warm only the metadata so the poster and UI stay responsive on weak mobile data.
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = coverVideo;
    video.load();

    return () => {
      preloadLinks.forEach((link) => link.remove());
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isInvitationOpen ? "auto" : "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isInvitationOpen]);

  async function primeMusic() {
    const music = musicRef.current;

    if (!music) return;

    try {
      music.muted = true;
      music.volume = 0;
      music.currentTime = 0;
      await music.play();
    } catch {
      // If the browser refuses the silent warmup, try again when the intro ends.
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
    setIsInvitationOpen(true);
  }

  return (
    <main className={isInvitationOpen ? "app app--scrollable" : "app"}>
      <AnimatePresence>
        {!isInvitationOpen ? (
          <motion.section
            key="intro"
            className="screen-layer"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <EnvelopeIntro
              onComplete={handleIntroComplete}
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
              transition: { duration: 0.01 },
            }}
          >
            <InvitationCard />
          </motion.section>
        )}
      </AnimatePresence>

      {hasMusic && (
        <audio ref={musicRef} preload="metadata" loop>
          {/* Replace src/assets/song.mp3 with the wedding song you want. */}
          {musicSources.ogg && <source src={musicSources.ogg} type="audio/ogg" />}
          {musicSources.m4a && <source src={musicSources.m4a} type="audio/mp4" />}
          {musicSources.mp3 && <source src={musicSources.mp3} type="audio/mpeg" />}
        </audio>
      )}

      {isInvitationOpen && hasMusic && (
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

      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            className="app-loading-screen"
            aria-live="polite"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <div className="app-loading-screen__inner">
              <p className="app-loading-screen__mark">J &amp; H</p>
              <p className="app-loading-screen__copy">Loading invitation...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
