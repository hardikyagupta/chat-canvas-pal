// Shared shell metrics for the full-page overlays — Agents, Reports, Scheduled,
// Chats, Bookmarks. These pages all render centered in the RHS column, so their
// left/right gutters are a product of the content max-width, not just the
// horizontal padding. Keeping both here stops the four pages drifting apart.

/**
 * Centered content column: same width and same 20px gutters on every page.
 *
 * 960px is the narrowest value that still fits the Agents table (min 900px)
 * inside the padding without an inner horizontal scroll.
 */
export const PAGE_COLUMN = 'w-full max-w-[960px] px-[20px]';

/**
 * Top padding above a page title. The docked widget needs a little more
 * breathing room than the expanded web view.
 */
export const pageHeaderPadTop = (compact: boolean): string => (compact ? 'pt-[12px]' : 'pt-[8px]');
