import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

const countdownUnits = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

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

export default function FloralFrameSection() {
  const { assets, wedding } = invitationContent;
  const weddingDate = useMemo(
    () => new Date(wedding.countdownTarget),
    [wedding.countdownTarget],
  );
  const [remaining, setRemaining] = useState(() => getRemainingTime(weddingDate));

  useEffect(() => {
    const tick = () => setRemaining(getRemainingTime(weddingDate));
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [weddingDate]);

  return (
    <motion.section
      className="floral-frame-section"
      aria-label={wedding.countdownLabel}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.48 }}
    >
      <img
        className="floral-frame-bg"
        src={assets.floralBackground}
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      <div className="green-countdown">
        <p className="green-countdown-heading">{wedding.countdownLabel}</p>
        <div className="green-countdown-grid">
          {countdownUnits.map(([key, label]) => (
            <div className="green-countdown-item" key={key}>
              <strong>{formatCountdownValue(remaining[key])}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Only the SVG flowers animate; the green artwork stays fixed in place. */}
      <motion.img
        className="floral-flower floral-flower--left"
        src={assets.flowerLeft}
        alt=""
        aria-hidden="true"
        draggable="false"
        variants={{
          hidden: { opacity: 0, x: "-54%", y: 8, rotate: -8, scale: 0.96 },
          visible: {
            opacity: 1,
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            transition: { delay: 0.22, duration: 1.15, ease: [0.22, 1, 0.36, 1] },
          },
        }}
      />

      <motion.img
        className="floral-flower floral-flower--right"
        src={assets.flowerRight}
        alt=""
        aria-hidden="true"
        draggable="false"
        variants={{
          hidden: { opacity: 0, x: "54%", y: 8, rotate: 8, scale: 0.96 },
          visible: {
            opacity: 1,
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            transition: { delay: 0.36, duration: 1.15, ease: [0.22, 1, 0.36, 1] },
          },
        }}
      />
    </motion.section>
  );
}
