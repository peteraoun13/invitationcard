import { motion } from "framer-motion";
import { invitationContent } from "../data/invitationContent.js";

export default function EnvelopeKeepsakeSection() {
  const { assets, couple } = invitationContent;

  return (
    <section
      className="envelope-keepsake-section"
      aria-label={`${couple.names} envelope keepsake`}
    >
      <motion.img
        className="envelope-keepsake-art"
        src={assets.envelopeKeepsake}
        alt={`${couple.names} wedding envelope with photos`}
        draggable="false"
        initial={{ opacity: 0, y: 34, scale: 0.96 }}
        whileInView={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
        }}
        viewport={{ once: true, amount: 0.45 }}
      />
    </section>
  );
}
