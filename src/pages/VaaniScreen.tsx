import { motion, AnimatePresence } from "framer-motion";
import { useKioskStore } from "@/store/kioskStore";

export function VaaniScreen() {
  const { screen, uploadPercent, retryInSeconds } = useKioskStore();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#1a1a1a] text-white">
      {/* Title Section */}
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-white mb-2">Vaani</h1>
        <p className="text-xl font-medium text-gray-300">Your voice for our city</p>
      </div>

      {/* Main Dynamic Area */}
      <div className="mt-16 flex h-64 w-full flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {screen === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center gap-2 h-16 w-full"
            >
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              ))}
            </motion.div>
          )}

          {screen === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              <SoundWave />
              <div className="flex items-center gap-3">
                <MicIcon className="h-6 w-6 text-amber-500 animate-pulse" />
                <span className="text-lg font-medium text-amber-500">Listening...</span>
              </div>
            </motion.div>
          )}

          {screen === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <div className="text-center">
                <p className="text-lg font-medium text-amber-500">Sending your voice...</p>
                <p className="text-sm text-gray-400 mt-1">{uploadPercent}%</p>
              </div>
            </motion.div>
          )}

          {screen === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckIcon />
              </div>
              <p className="text-lg font-medium text-emerald-400">Sent successfully!</p>
            </motion.div>
          )}

          {screen === "upload-failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                <XIcon />
              </div>
              <div>
                <p className="text-lg font-medium text-red-400">Connection poor</p>
                <p className="text-sm text-gray-400 mt-1">
                  Saved locally. Will retry in {retryInSeconds}s...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SoundWave() {
  // A simple, elegant wave animation that doesn't rely on the physical microphone stream.
  // This guarantees it will always animate smoothly without browser autoplay policy issues.
  
  // These values represent the peak heights of the wave (in percentage)
  const peakHeights = [20, 35, 50, 70, 90, 70, 50, 35, 20, 35, 50, 70, 50, 35, 20];

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 w-full">
      {peakHeights.map((peak, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-amber-500 rounded-full"
          animate={{
            height: ["10%", `${peak}%`, "10%"],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1, // Stagger the animation to create a wave effect across the dots
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function MicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
