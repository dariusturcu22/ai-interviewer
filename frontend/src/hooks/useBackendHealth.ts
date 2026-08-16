"use client";

import { useEffect, useState } from "react";

import { checkHealth } from "@/lib/api";

const POLL_INTERVAL_MS = 4000;

export type BackendStatus = "checking" | "ready";

export function useBackendHealth() {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    if (status === "ready") return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        await checkHealth();
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [status]);

  return status;
}
