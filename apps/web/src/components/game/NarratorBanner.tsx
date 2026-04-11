'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface NarratorBannerProps {
  messages: string[];
}

export default function NarratorBanner({ messages }: NarratorBannerProps) {
  const lastMessage = messages[messages.length - 1];

  return (
    <AnimatePresence mode="wait">
      {lastMessage && (
        <motion.div
          key={lastMessage}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-killer-surface/90 border border-killer-gold/20 rounded-xl px-6 py-4
            text-center backdrop-blur-sm"
        >
          <p className="text-killer-gold text-xs font-bold mb-1">המנחה</p>
          <p className="text-killer-text font-medium">{lastMessage}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
