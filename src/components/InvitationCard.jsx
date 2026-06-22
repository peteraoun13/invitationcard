import { motion } from "framer-motion";
import CoverSection from "./CoverSection.jsx";
import EnvelopeKeepsakeSection from "./EnvelopeKeepsakeSection.jsx";
import FloralFrameSection from "./FloralFrameSection.jsx";
import TimelineSection from "./TimelineSection.jsx";
import WeddingInvitationSection from "./WeddingInvitationSection.jsx";

const assetModules = import.meta.glob("../assets/paper-texture.png", {
  eager: true,
  import: "default",
  query: "?url",
});

const paperTexture = assetModules["../assets/paper-texture.png"] ?? "";

export default function InvitationCard() {
  return (
    <div
      className="invitation-page"
      style={
        paperTexture
          ? { "--paper-texture": `url("${paperTexture}")` }
          : undefined
      }
    >
      <motion.div
        className="site-reveal-wash"
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{
          opacity: 0,
          transition: { duration: 1.15, ease: [0.22, 1, 0.36, 1] },
        }}
      />
      <CoverSection />
      <WeddingInvitationSection />
      <FloralFrameSection />
      <EnvelopeKeepsakeSection />
      <TimelineSection />
    </div>
  );
}
