import { useEffect, useState } from "react";

export function useClock(tickMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);

  return now;
}
