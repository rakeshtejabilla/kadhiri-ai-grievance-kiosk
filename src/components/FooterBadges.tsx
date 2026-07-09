const BADGES = [
  { label: "Speak Naturally", sub: "No typing required" },
  { label: "Motion Activated", sub: "Automatic recording" },
  { label: "Secure & Reliable", sub: "Your data is safe" },
  { label: "Public Service", sub: "For everyone" },
  { label: "100% Anonymous", sub: "No personal data required" },
] as const;

export function FooterBadges() {
  return (
    <div className="grid grid-cols-5 gap-4 rounded-2xl bg-white/70 p-4">
      {BADGES.map((badge) => (
        <div key={badge.label} className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gov-blueLight text-gov-blue">
            <ShieldDot />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-gov-navy">{badge.label}</p>
            <p className="text-[11px] text-slate-500">{badge.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShieldDot() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
