const SUGGESTIONS = [
  "How you learned to do your job",
  "Your relationship with your phone",
  "A place that shaped who you are",
  "How your morning routine came to be",
];

export function TopicSuggestions({
  onSelect,
}: {
  onSelect: (topic: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="bg-secondary/50 text-secondary-foreground hover:bg-secondary rounded-full border px-3 py-1.5 text-sm transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
