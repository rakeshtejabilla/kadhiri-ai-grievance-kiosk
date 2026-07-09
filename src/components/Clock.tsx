import { useClock } from "@/hooks/useClock";
import { formatClock } from "@/utils/time";

export function Clock() {
  const now = useClock();
  const { time, dateLabel } = formatClock(now);

  return (
    <div className="text-right leading-tight">
      <p className="text-sm text-gov-blue/70">{dateLabel}</p>
      <p className="text-2xl font-bold text-gov-navy">{time}</p>
    </div>
  );
}
