import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

export default function WeddingInvitationSection() {
  const { couple, wedding } = invitationContent;

  return (
    <motion.section
      className="invitation-section wedding-invitation-section"
      initial={{ opacity: 0, y: 34 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
      }}
      viewport={{ once: true, amount: 0.32 }}
    >
      {/* Change this section text in src/data/invitationContent.js. */}
      <h2 className="section-title wedding-invitation-title">
        {wedding.invitationTitle}
      </h2>
      <span className="section-rule wedding-invitation-rule" aria-hidden="true" />

      <div className="wedding-copy-stack">
        <p>{wedding.familyLine},</p>
        <p className="script-names">{couple.names}</p>
        <p>{wedding.inviteLine}</p>
        <p>{wedding.welcomeLine}</p>
      </div>
    </motion.section>
  );
}
