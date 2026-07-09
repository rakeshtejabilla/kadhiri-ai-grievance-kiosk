import { RECENT_COMPLAINTS } from "@/utils/constants";

export function RecentComplaintsList() {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CheckBadge />
        <h3 className="text-sm font-semibold text-gov-navy">Recently Cleared Complaints</h3>
      </div>
      <ul className="space-y-3">
        {RECENT_COMPLAINTS.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckMark />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckBadge() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gov-success/15 text-gov-success">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-gov-success" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
