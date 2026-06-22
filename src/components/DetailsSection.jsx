import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

export default function DetailsSection() {
  const { wedding, actions } = invitationContent;

  return (
    <motion.section
      className="invitation-section details-section"
      initial={{ opacity: 0, y: 34 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
      }}
      viewport={{ once: true, amount: 0.28 }}
    >
      <h2 className="section-title">The Details</h2>

      <div className="details" aria-label="Wedding details">
        {wedding.details.map((item) => (
          <div className="detail-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      {/* Edit these final action buttons in src/data/invitationContent.js. */}
      <div className="action-row">
        {actions.map((action) => (
          <a
            className={
              action.variant === "primary" ? "button button--primary" : "button"
            }
            href={action.href}
            key={action.label}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noreferrer" : undefined}
            download={action.download}
          >
            {action.label}
          </a>
        ))}
      </div>
    </motion.section>
  );
}
