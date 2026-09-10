/**
 * A workout the user forgot to end keeps ticking. Anything past this is treated
 * as a forgotten session, not a long one, and recorded as
 * RUNAWAY_REPLACEMENT_MINUTES instead — otherwise a single 50-hour entry drags
 * the average workout length past every real one.
 */
export const RUNAWAY_MINUTES = 240;
export const RUNAWAY_REPLACEMENT_MINUTES = 90;
