/**
 * Mock for motion/react used in vitest tests.
 * Strips all animation behaviour so that AnimatePresence unmounts
 * children synchronously and motion.* components render as plain divs.
 */
import React from "react";

// AnimatePresence: render children as-is (no exit-animation delay)
export function AnimatePresence({
  children,
}: {
  children?: React.ReactNode;
  mode?: string;
  initial?: boolean;
}) {
  return <>{children}</>;
}

// Cache of tag → forwardRef component so React sees a stable component identity
// across renders and never unmounts/remounts children due to a new component type.
const componentCache = new Map<string, React.ForwardRefExoticComponent<Record<string, unknown>>>();

function createMotionComponent(tag: string) {
  const cached = componentCache.get(tag);
  if (cached) return cached;

  const component = React.forwardRef<HTMLElement, Record<string, unknown> & { children?: React.ReactNode }>(
    (
      {
        children,
        // strip motion-only props
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        whileHover: _wh,
        whileTap: _wt,
        whileFocus: _wf,
        whileInView: _wiv,
        variants: _v,
        layout: _l,
        layoutId: _lid,
        ...rest
      },
      ref,
    ) =>
      React.createElement(
        tag,
        { ...rest, ref } as React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> },
        children as React.ReactNode,
      ),
  );
  component.displayName = `motion.${tag}`;
  componentCache.set(tag, component as unknown as React.ForwardRefExoticComponent<Record<string, unknown>>);
  return component;
}

// motion proxy: return a stable cached component for every HTML tag
export const motion = new Proxy(
  {},
  {
    get(_target, tag: string | symbol) {
      if (typeof tag !== "string") return undefined;
      return createMotionComponent(tag);
    },
  },
) as unknown as typeof import("motion/react").motion;

// Re-export other commonly-used symbols as no-ops / pass-throughs
export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
});
export const useMotionValue = (initial: unknown) => ({
  get: () => initial,
  set: () => {},
  onChange: () => () => {},
});
export const useTransform = (_v: unknown, _i: unknown, _o: unknown) => ({
  get: () => 0,
});
export const useSpring = (initial: unknown) => ({
  get: () => initial,
  set: () => {},
});
export const useScroll = () => ({ scrollY: { get: () => 0 } });
export const useInView = () => false;
export const animate = () => ({ stop: () => {} });
export const stagger = () => 0;
