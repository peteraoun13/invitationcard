import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

export default function TimelineSection() {
  const { assets, wedding } = invitationContent;

  return (
    <motion.section
      className="timeline-section"
      aria-label="Wedding timeline"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
      }}
      viewport={{ once: true, amount: 0.22 }}
    >
      <header className="timeline-header">
        <h2 className="section-title timeline-title">Timeline</h2>
        <span className="section-rule" aria-hidden="true" />
      </header>

      <img
        className="timeline-art"
        src={assets.timelineArt}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        draggable="false"
      />

      <div className="timeline-events">
        {wedding.timeline.map((item) => (
          <article
            className={`timeline-event timeline-event--${item.side}`}
            key={item.title}
          >
            <span className="timeline-event-rule" aria-hidden="true" />
            <h3>{item.title}</h3>
            <p className="timeline-time">{item.time}</p>
            <p className="timeline-venue">{item.venue}</p>
            <a
              className="location-button"
              href={item.locationUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span className="location-pin" aria-hidden="true" />
              View Location
            </a>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
