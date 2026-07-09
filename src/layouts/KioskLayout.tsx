import type { ReactNode } from "react";

interface KioskLayoutProps {
  children: ReactNode;
  background?: string;
}

/**
 * Locks the app to a 1920x1080 canvas that fills the Electron BrowserWindow.
 * Individual screens only worry about what goes inside; this shell owns the
 * outer bezel, background, and overflow clipping so nothing can scroll or
 * spill off a real kiosk display.
 */
export function KioskLayout({ children, background = "bg-gov-blueLight" }: KioskLayoutProps) {
  return (
    <div className={`flex h-screen w-screen items-center justify-center ${background}`}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">{children}</div>
    </div>
  );
}
