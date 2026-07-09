import { HOW_TO_USE_STEPS } from "@/utils/constants";

export function HowToUseCard() {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-gov-blue">
          <MicIcon />
        </span>
        <h3 className="text-sm font-semibold text-gov-navy">How to Use</h3>
      </div>

      <ol className="flex-1 space-y-4">
        {HOW_TO_USE_STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-sm text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gov-blueLight text-gov-blue">
              <MicIcon small />
            </span>
            <span>
              {i + 1}. {step}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-2 text-xs font-medium text-gov-blue/70">No touch required</p>
    </div>
  );
}

function MicIcon({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={small ? "h-3.5 w-3.5" : "h-4 w-4"} fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M6 11a6 6 0 0012 0M12 19v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
