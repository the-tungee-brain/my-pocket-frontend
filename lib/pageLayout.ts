/** Primary app content width (portfolio, research, chat). */
const pageShellWidth = "mx-auto w-full max-w-6xl 2xl:max-w-7xl";

/** Width-only shell — use inside AppShell (horizontal padding comes from the shell). */
export const pageShellClass = pageShellWidth;

/** Width + padding for standalone/marketing pages (landing, security header). */
export const pageShellStandaloneClass = `${pageShellWidth} px-4 sm:px-6`;

/** Settings, security, and other form-focused in-app pages. */
export const pageNarrowClass = "mx-auto w-full max-w-3xl";

/** Narrow standalone pages (security body, settings loading). */
export const pageNarrowStandaloneClass = `${pageNarrowClass} px-4 sm:px-6`;

/** Alias for narrow in-app layouts. */
export const pageFormClass = pageNarrowClass;

/** Centered card / waitlist / modal content. */
export const pageContentClass = "mx-auto w-full max-w-lg";

/** Prose-width centered copy inside a section. */
export const pageProseClass = "mx-auto w-full max-w-2xl";

/** Long-form research articles (overview big picture, business tab). */
export const pageArticleClass = "mx-auto w-full max-w-3xl";

/** Drop per-card max-width when a section sits inside {@link pageShellClass}. */
export const pageSectionClass = "mx-0 w-full max-w-none";

/** Primary + sidebar split — stacks on mobile/tablet, side-by-side from lg. */
export const pageSplitClass =
  "grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.62fr)_minmax(220px,1fr)] lg:items-start";

/** Horizontal scroll wrapper for wide data tables. */
export const responsiveTableScrollClass = "overflow-x-auto scrollbar-dark";

export const pageMainClass = "min-w-0 space-y-4";

export const pageAsideClass = "min-w-0 space-y-4 lg:max-w-sm xl:max-w-none";
