interface ProgressRingProps {
  percent: number;
  size?: number;
}

export function ProgressRing({ percent, size = 200 }: ProgressRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#DCEBFB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E9E5A"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <CloudUploadIcon />
      </div>
    </div>
  );
}

function CloudUploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-16 w-16 text-gov-accent" fill="none">
      <path
        d="M7 18a4 4 0 01-.5-7.97A5 5 0 0116.9 9.02 4.5 4.5 0 0117 18H7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 17v-6m0 0l-2.5 2.5M12 11l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
