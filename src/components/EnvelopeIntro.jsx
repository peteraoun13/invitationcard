import { useRef, useState } from "react";
import { motion } from "framer-motion";

const assetModules = import.meta.glob(
  [
    "../assets/envelope-closed.png",
    "../assets/opening-video.mp4",
    "../assets/opening-video.webm",
  ],
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

function getOptionalAsset(fileName) {
  return assetModules[`../assets/${fileName}`] ?? "";
}

const assets = {
  // Change this file in src/assets/ if you want a different first frame.
  envelopeClosed: getOptionalAsset("envelope-closed.png"),
  // Change these files in src/assets/ when replacing the opening animation.
  openingMp4: getOptionalAsset("opening-video.mp4"),
  openingWebm: getOptionalAsset("opening-video.webm"),
};

export default function EnvelopeIntro({ onComplete, onStartMusic }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [imageFailed, setImageFailed] = useState(false);

  const hasClosedImage = assets.envelopeClosed && !imageFailed;
  const hasVideo = Boolean(assets.openingMp4 || assets.openingWebm);
  const isPlaying = status === "playing";
  const isComplete = status === "complete";
  const showFallbackButton = status === "fallback";

  function finishIntro() {
    if (status === "complete") return;

    setStatus("complete");
    window.setTimeout(onComplete, 920);
  }

  async function startOpening() {
    if (status !== "idle") return;

    // Start music from this real tap/click so mobile browsers allow playback.
    onStartMusic?.();
    setStatus("playing");

    if (!hasVideo) {
      // If opening-video.mp4/webm is missing, still let guests enter.
      window.setTimeout(finishIntro, 520);
      return;
    }

    const video = videoRef.current;

    try {
      if (!video) throw new Error("Opening video is not ready.");

      video.currentTime = 0;
      await video.play();
    } catch {
      // Mobile browsers can reject playback if the file is missing or blocked.
      setStatus("fallback");
    }
  }

  return (
    <div className="intro-screen" aria-label="Interactive envelope invitation">
      <div className="intro-media-frame">
        {hasClosedImage ? (
          <motion.img
            className="intro-media intro-media--image"
            src={assets.envelopeClosed}
            alt="Closed wedding invitation envelope"
            draggable="false"
            animate={{
              opacity: status === "idle" || showFallbackButton ? 1 : 0,
              scale: isPlaying ? 1.015 : 1,
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="intro-media intro-media--placeholder">
            {/* Replace src/assets/envelope-closed.png with the closed envelope image. */}
          </div>
        )}

        {hasVideo && (
          <motion.video
            ref={videoRef}
            className="intro-media intro-media--video"
            muted
            playsInline
            preload="auto"
            controls={false}
            animate={{ opacity: isPlaying || isComplete ? 1 : 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            onEnded={finishIntro}
            onError={() => setStatus("fallback")}
          >
            {assets.openingWebm && (
              <source src={assets.openingWebm} type="video/webm" />
            )}
            {assets.openingMp4 && (
              <source src={assets.openingMp4} type="video/mp4" />
            )}
          </motion.video>
        )}

        <div className="intro-vignette" />

        <motion.div
          className="intro-white-fade"
          aria-hidden="true"
          animate={{ opacity: isComplete ? 1 : 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        />

        {status === "idle" && (
          <motion.button
            type="button"
            className="wax-hotspot"
            aria-label="Open the wedding invitation"
            onClick={startOpening}
            whileTap={{ scale: 0.92 }}
          >
            {/* Change left/top/width/height in .wax-hotspot to move the wax click position. */}
            <motion.span
              className="wax-hotspot__pulse"
              animate={{ opacity: [0.2, 0.55, 0.2], scale: [1, 1.16, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.button>
        )}

        {showFallbackButton && (
          <motion.button
            type="button"
            className="intro-fallback-button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={finishIntro}
          >
            Open Invitation
          </motion.button>
        )}
      </div>
    </div>
  );
}
