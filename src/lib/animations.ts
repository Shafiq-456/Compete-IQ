import type { Variants, Transition } from 'framer-motion'

/* Standard easing — a soft "out expo" feel */
const EASE: Transition['ease'] = [0.22, 1, 0.36, 1]

/** Fade in + slide up 12px, duration 0.4s */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
}

/** Simple opacity fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
}

/** Scale from 0.95 to 1 with fade */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: EASE },
  },
}

/** Slide in from right 24px */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASE },
  },
}

/** Slide in from left 24px */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASE },
  },
}

/** Stagger children by 0.05s */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
}

/** Faster stagger (0.03s) for tighter grids like KPI strips */
export const staggerContainerFast: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
}

/**
 * Pulsing box-shadow glow for highlighted cards / badges.
 * Use as a child variant of a staggerContainer, or standalone with
 * initial="hidden" animate="show".
 */
export const glowPulse: Variants = {
  hidden: {
    boxShadow: '0 0 0px color-mix(in oklch, var(--primary) 0%, transparent)',
  },
  show: {
    boxShadow: [
      '0 0 8px color-mix(in oklch, var(--primary) 30%, transparent)',
      '0 0 22px color-mix(in oklch, var(--primary) 60%, transparent)',
      '0 0 8px color-mix(in oklch, var(--primary) 30%, transparent)',
    ],
    transition: {
      duration: 2.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/** Convenience hover props for KPI-style interactive cards */
export const hoverGlow = {
  scale: 1.02,
  boxShadow: '0 0 24px color-mix(in oklch, var(--primary) 45%, transparent)',
  transition: { duration: 0.2, ease: EASE },
}

export const hoverLift = {
  y: -2,
  scale: 1.01,
  transition: { duration: 0.2, ease: EASE },
}

/** Standard initial/animate pair to spread onto motion containers */
export const motionEnter = {
  initial: 'hidden' as const,
  animate: 'show' as const,
}
