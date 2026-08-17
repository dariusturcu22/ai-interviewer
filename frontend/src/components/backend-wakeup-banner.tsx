import { Loader2 } from "lucide-react";

export function BackendWakeupBanner() {
  return (
    <div className="bg-muted/50 text-muted-foreground flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
      <Loader2 className="size-4 shrink-0 animate-spin" />
      <p>
        Waking up the server, it sleeps after inactivity on the free hosting
        tier, this can take up to a minute.
      </p>
    </div>
  );
}
