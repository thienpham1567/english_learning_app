import { useEffect, useState } from "react";

/**
 * Hook that listens to a CSS media query and returns whether it matches.
 * SSR-safe: returns `false` during server rendering.
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 1280px)");
 * const isTablet = useMediaQuery("(min-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
