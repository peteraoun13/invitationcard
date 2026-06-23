import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

export default function CoverSection() {
  const { assets, couple, wedding } = invitationContent;
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = Boolean(assets.coverVideo) && !videoFailed;

  function startCoverVideo() {
    const video = videoRef.current;

    if (!video) return;

    video.play().catch(() => {
      // Muted autoplay is allowed on modern phones, but the fallback remains safe.
    });
  }

  return (
    <section className="cover-section" aria-label={`${couple.names} wedding cover`}>
      {showVideo ? (
        <video
          ref={videoRef}
          className="cover-photo cover-video"
          src={assets.coverVideo}
          aria-label={`${couple.names} wedding cover video`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          onLoadedData={startCoverVideo}
          onCanPlay={startCoverVideo}
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <img
          className="cover-photo"
          src={assets.coverPhoto}
          alt={`${couple.names} wedding portrait`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable="false"
        />
      )}

      <div className="cover-shade" aria-hidden="true" />

      <motion.div
        className="cover-copy"
        initial={{ opacity: 0, y: 18 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.28, duration: 1.15, ease: [0.22, 1, 0.36, 1] },
        }}
      >
        <h1>{couple.names}</h1>
        <p>{wedding.shortDate}</p>
      </motion.div>

      <div className="cover-paper-edge" aria-hidden="true" />
    </section>
  );
}
