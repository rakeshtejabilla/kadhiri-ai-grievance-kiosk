interface GovHeaderProps {
  variant?: "light" | "dark";
  title?: string;
  className?: string;
}

/**
 * Renders the small government-seal + "Government of India" lockup shown at
 * the top of every screen in the reference design. The emblem is drawn as a
 * simple generic pillar/star mark rather than a precise reproduction of any
 * official state emblem artwork.
 */
export function GovHeader({ variant = "light", title, className = "" }: GovHeaderProps) {
  const textColor = variant === "dark" ? "text-white" : "text-gov-navy";
  const subColor = variant === "dark" ? "text-white/80" : "text-gov-blue/70";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <EmblemMark className={variant === "dark" ? "text-white" : "text-gov-navy"} />
      <div className="leading-tight">
        <p className={`text-sm font-semibold ${textColor}`}>{title ?? "Government of India"}</p>
        {!title && <p className={`text-[11px] ${subColor}`}>भारत सरकार</p>}
      </div>
    </div>
  );
}

function EmblemMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`h-9 w-9 shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M24 8c1.5 4 4 6 8 7-4 1-6.5 3-8 7-1.5-4-4-6-8-7 4-1 6.5-3 8-7Z"
        fill="currentColor"
      />
      <rect x="14" y="30" width="20" height="3" rx="1.5" fill="currentColor" />
      <rect x="10" y="35" width="28" height="2.4" rx="1.2" fill="currentColor" />
    </svg>
  );
}
