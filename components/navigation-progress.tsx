"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setIsNavigating(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [pathname]);

  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args: Parameters<typeof originalPushState>) {
      setIsNavigating(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsNavigating(false), 8000);
      return originalPushState(...args);
    };

    window.history.replaceState = function (...args: Parameters<typeof originalReplaceState>) {
      const url = args[2];
      if (url && typeof url === "string" && url !== window.location.pathname) {
        setIsNavigating(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsNavigating(false), 8000);
      }
      return originalReplaceState(...args);
    };

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div className="nav-progress-bar h-full w-full bg-law/80" />
    </div>
  );
}
