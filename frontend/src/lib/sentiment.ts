import type { Sentiment } from "@/lib/api";

export const sentimentLabel: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  mixed: "Mixed",
};

export const sentimentBadgeClass: Record<Sentiment, string> = {
  positive:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  neutral: "bg-secondary text-secondary-foreground",
  negative: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  mixed: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};
