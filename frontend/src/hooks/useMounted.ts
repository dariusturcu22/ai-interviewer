import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

// True only after client-side hydration. Lets a component render an SSR-safe fallback
// on the first pass and switch to client-only content (random values, browser APIs)
// without tripping the "no setState in an effect" lint rule or a hydration mismatch.
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
