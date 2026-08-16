"use client";

import { BackendWakeupBanner } from "@/components/backend-wakeup-banner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useBackendHealth } from "@/hooks/useBackendHealth";

export default function Home() {
  const backendStatus = useBackendHealth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold tracking-tight">Mini AI Interviewer</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
        {backendStatus === "checking" && (
          <div className="w-full max-w-md">
            <BackendWakeupBanner />
          </div>
        )}
        <Button disabled={backendStatus !== "ready"}>Start Interview</Button>
      </main>
    </div>
  );
}
