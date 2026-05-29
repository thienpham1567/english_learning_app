/**
 * Standardized motion presets for Framer Motion interactions.
 *
 * Neo-Brutalism prefers translation-based hover (button "presses into" page)
 * over scale-based hover. Use `tapBrutalist` for buttons/CTAs.
 * Use scale presets only for decorative elements (icons, badges).
 */

/** Subtle feedback for cards and list items */
export const TAP_SUBTLE = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.99 },
} as const;

/** Standard feedback for buttons and interactive elements */
export const TAP_STANDARD = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
} as const;

/** Strong emphasis for primary CTAs and celebration elements */
export const TAP_STRONG = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
} as const;

/**
 * Neo-Brutalist: offset-based hover instead of scale.
 * Button appears to "lift" then "press" into the surface.
 */
export const TAP_BRUTALIST = {
  whileHover: { x: -1, y: -1 },
  whileTap: { x: 1, y: 1 },
} as const;

/** Stagger children animation variants */
export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
} as const;

/** Fade-in from bottom (common page section entrance) */
export const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay },
});
