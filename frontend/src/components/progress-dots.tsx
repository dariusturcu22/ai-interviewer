export function ProgressDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Question ${count}`}>
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="bg-primary size-2 rounded-full"
          style={{ opacity: 0.4 + (0.6 * (index + 1)) / count }}
        />
      ))}
    </div>
  );
}
