"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mounts a 5s router.refresh() interval so a server-rendered (force-dynamic)
 * page re-runs and re-reads SQLite without manual reload. Used everywhere we
 * need the MCP UI to stay aligned with live Beacon activity.
 *
 * Tab visibility is respected — background tabs don't poll.
 */
export function LivePoll({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (typeof document === "undefined" || !document.hidden) router.refresh();
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
