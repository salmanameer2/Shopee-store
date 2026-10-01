import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

/**
 * Cinematic top scroll progress bar with glow effect and spring physics
 */
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none">
      <motion.div
        className="h-full bg-gradient-to-r from-[#FF5722] via-[#FF8A65] to-[#E64A19] origin-left shadow-[0_0_12px_rgba(255,87,34,0.8)]"
        style={{ scaleX }}
      />
    </div>
  );
}
