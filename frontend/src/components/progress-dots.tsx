export function ProgressDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Question ${count}`}>
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="size-1.5 rounded-full bg-primary"
          style={{ opacity: 0.4 + (0.6 * (index + 1)) / count }}
        />
      ))}
    </div>
  );
}
