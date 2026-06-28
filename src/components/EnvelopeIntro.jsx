import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const INTRO_ASSET_VERSION = "20260627-1";

export const envelopeIntroAssets = {
  // These live in public/ so the intro can load from stable, high-priority URLs.
  envelopeClosed: `/envelope-closed.jpg?v=${INTRO_ASSET_VERSION}`,
  openingMp4: `/opening-video.mp4?v=${INTRO_ASSET_VERSION}`,
  openingWebm: "",
};

export default function EnvelopeIntro({
  envelopeReady = false,
  onComplete,
  onEnvelopeReady,
  onOpeningVideoReady,
  onPrepareInvitationMedia,
  onPrimeMusic,
  onStartMusic,
}) {
  const videoRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const maxIntroTimeoutRef = useRef(null);
  const isCompleteRef = useRef(false);
  const hasStartedVideoRef = useRef(false);
  const playStartedAtRef = useRef(0);
  const videoReadyRef = useRef(false);
  const [status, setStatus] = useState("idle");
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const hasClosedImage =
    Boolean(envelopeIntroAssets.envelopeClosed) &&
    !imageFailed;
  const hasVideo = Boolean(
    envelopeIntroAssets.openingMp4 || envelopeIntroAssets.openingWebm,
  ) && !videoFailed;
  const isStarting = status === "starting";
  const isPlaying = status === "playing";
  const isComplete = status === "complete";
  const canOpen = hasClosedImage && envelopeReady && hasVideo && videoReady;

  useEffect(() => {
    return () => {
      window.clearTimeout(retryTimeoutRef.current);
      window.clearTimeout(maxIntroTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !hasVideo) {
      return;
    }

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.load();
  }, [hasVideo]);

  function finishIntro() {
    if (isCompleteRef.current || !hasStartedVideoRef.current) return;

    const visiblePlaybackTime = window.performance.now() - playStartedAtRef.current;

    if (visiblePlaybackTime < 900) {
      window.clearTimeout(maxIntroTimeoutRef.current);
      maxIntroTimeoutRef.current = window.setTimeout(finishIntro, 900 - visiblePlaybackTime);
      return;
    }

    isCompleteRef.current = true;
    window.clearTimeout(retryTimeoutRef.current);
    window.clearTimeout(maxIntroTimeoutRef.current);
    setStatus("complete");
    onStartMusic?.();
    window.setTimeout(onComplete, 460);
  }

  function handleVideoStarted() {
    if (hasStartedVideoRef.current) {
      return;
    }

    hasStartedVideoRef.current = true;
    playStartedAtRef.current = window.performance.now();
    window.clearTimeout(retryTimeoutRef.current);
    window.clearTimeout(maxIntroTimeoutRef.current);
    setStatus("playing");

    const video = videoRef.current;
    const duration = video?.duration;
    const safetyTimeout = Number.isFinite(duration)
      ? Math.min(Math.max(duration * 1000 + 1200, 4200), 12000)
      : 9000;

    maxIntroTimeoutRef.current = window.setTimeout(
      finishIntro,
      safetyTimeout,
    );
  }

  function handleVideoReady() {
    if (!videoReadyRef.current) {
      videoReadyRef.current = true;
      setVideoReady(true);
      onOpeningVideoReady?.();
    }

    setVideoFailed(false);

    if (isStarting) {
      tryPlayOpeningVideo();
    }
  }

  function tryPlayOpeningVideo(attempt = 0) {
    const video = videoRef.current;

    if (isCompleteRef.current || !video) {
      return;
    }

    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();

    if (!playPromise?.catch) {
      return;
    }

    playPromise.then(handleVideoStarted).catch(() => {
      if (isCompleteRef.current || hasStartedVideoRef.current) {
        return;
      }

      retryTimeoutRef.current = window.setTimeout(() => {
        if (attempt > 0) {
          video.load();
        }

        tryPlayOpeningVideo(attempt + 1);
      }, 520);
    });
  }

  function handleVideoError() {
    videoReadyRef.current = false;
    setVideoFailed(true);
    setVideoReady(false);
    window.clearTimeout(retryTimeoutRef.current);
    setStatus("idle");
  }

  function startOpening() {
    if (status !== "idle" || !canOpen) return;

    onPrimeMusic?.();
    onPrepareInvitationMedia?.();
    hasStartedVideoRef.current = false;
    playStartedAtRef.current = 0;
    setStatus("starting");

    const video = videoRef.current;

    try {
      if (!video) throw new Error("Opening video is not ready.");

      video.currentTime = 0;
      tryPlayOpeningVideo();
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="intro-screen" aria-label="Interactive envelope invitation">
      <div className="intro-media-frame">
        {hasClosedImage && (
          <motion.img
            className="intro-media intro-media--image"
            src={envelopeIntroAssets.envelopeClosed}
            alt="Closed wedding invitation envelope"
            draggable="false"
            animate={{
              opacity: status === "idle" ? 1 : 0,
              scale: isPlaying ? 1.015 : 1,
            }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onLoad={onEnvelopeReady}
            onError={() => setImageFailed(true)}
          />
        )}

        {hasVideo && (
          <motion.video
            ref={videoRef}
            className="intro-media intro-media--video"
            muted
            playsInline
            preload="auto"
            poster={envelopeIntroAssets.envelopeClosed}
            controls={false}
            animate={{ opacity: isStarting || isPlaying || isComplete ? 1 : 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            onEnded={finishIntro}
            onError={handleVideoError}
            onLoadedData={handleVideoReady}
            onCanPlay={handleVideoReady}
            onPlaying={handleVideoStarted}
          >
            {envelopeIntroAssets.openingWebm && (
              <source src={envelopeIntroAssets.openingWebm} type="video/webm" />
            )}
            {envelopeIntroAssets.openingMp4 && (
              <source src={envelopeIntroAssets.openingMp4} type="video/mp4" />
            )}
          </motion.video>
        )}

        <div className="intro-vignette" />

        <motion.div
          className="intro-white-fade"
          aria-hidden="true"
          animate={{ opacity: isComplete ? 0.48 : 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        />

        {status === "idle" && canOpen && (
          <motion.button
            type="button"
            className="wax-hotspot"
            aria-label="Open the wedding invitation"
            onClick={startOpening}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              className="wax-hotspot__pulse"
              animate={{ opacity: [0.18, 0.52, 0.18], scale: [1, 1.16, 1] }}
              transition={{
                duration: 2.35,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.button>
        )}
      </div>
    </div>
  );
}
