import { Loader2 } from "lucide-react";

export function BackendWakeupBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      <Loader2 className="size-4 shrink-0 animate-spin" />
      <p>
        Waking up the server — it sleeps after inactivity on the free hosting tier, this can
        take up to a minute.
      </p>
    </div>
  );
}
