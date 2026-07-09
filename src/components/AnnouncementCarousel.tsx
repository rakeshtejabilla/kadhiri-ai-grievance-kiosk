import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ANNOUNCEMENTS } from "@/utils/constants";

export function AnnouncementCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const current = ANNOUNCEMENTS[index];

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-gov-blue">
          <MegaphoneIcon />
        </span>
        <h3 className="text-sm font-semibold text-gov-navy">Government Announcements</h3>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl bg-gov-navy p-4 text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-base font-semibold">{current.title}</p>
            <p className="mt-2 text-sm text-white/85">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-3 left-4 flex gap-1.5">
          {ANNOUNCEMENTS.map((item, i) => (
            <span
              key={item.title}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M3 10v4a1 1 0 001 1h2l5 4V5l-5 4H4a1 1 0 00-1 1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16 9a3 3 0 010 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
