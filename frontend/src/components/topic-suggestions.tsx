"use client";

import { useMemo } from "react";

import { useMounted } from "@/hooks/useMounted";

// A larger pool than what's shown at once, mixing the assignment brief's own examples
// (AI in the workplace, productivity tools, scientific research) with more personal,
// narrative-style prompts that fit this app's adaptive-interview format.
const SUGGESTION_POOL = [
  "AI in the workplace",
  "Productivity tools you actually use",
  "Scientific research that excites you",
  "How you learned to do your job",
  "Your relationship with your phone",
  "A place that shaped who you are",
  "How your morning routine came to be",
  "A skill you taught yourself",
  "How you handle stress",
  "A trip you still think about",
  "The best advice you've ever gotten",
  "How your taste in music has changed",
  "A hobby that taught you patience",
  "Your first job",
  "A book, show, or film that changed how you think",
  "What home means to you",
  "A tradition your family keeps",
  "Something you collect",
];

const SUGGESTIONS_SHOWN = 6;

function pickRandomTopics(): string[] {
  const shuffled = [...SUGGESTION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, SUGGESTIONS_SHOWN);
}

export function TopicSuggestions({
  onSelect,
}: {
  onSelect: (topic: string) => void;
}) {
  // Renders a fixed slice on the server and on the client's first pass so hydration
  // matches, then swaps to a random selection once mounted - the same pattern
  // ThemeToggle uses for client-only state that can't be computed during SSR.
  const mounted = useMounted();
  const suggestions = useMemo(
    () =>
      mounted
        ? pickRandomTopics()
        : SUGGESTION_POOL.slice(0, SUGGESTIONS_SHOWN),
    [mounted],
  );

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="bg-secondary/50 text-secondary-foreground hover:bg-secondary rounded-full border px-4 py-2 text-sm transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
