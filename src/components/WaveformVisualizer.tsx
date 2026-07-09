const BAR_COUNT = 40;

/**
 * Purely decorative animated waveform (each bar animates on its own
 * randomized duration/delay) to convey "we are actively listening" without
 * requiring a real-time FFT of the microphone signal in the renderer.
 */
export function WaveformVisualizer() {
  return (
    <div className="flex h-10 w-full items-center justify-center gap-1">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const duration = 0.6 + ((i * 37) % 5) / 10;
        const delay = ((i * 53) % 10) / 10;
        const height = 8 + ((i * 29) % 24);
        return (
          <span
            key={i}
            className="w-1 rounded-full bg-white/70 animate-waveform"
            style={{
              height,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
