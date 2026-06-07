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

import {
  appGapClass,
  appMainClass,
  appSplitClass,
  appStackClass,
} from "@/lib/appUi";

/** Primary + sidebar split — stacks on mobile/tablet, side-by-side from lg. */
export const pageSplitClass = appSplitClass;

/** Research overview — single column through xl, split from xl up. */
export const pageOverviewSplitClass = `grid ${appGapClass} w-full grid-cols-1 [&>*]:min-w-0 [&>*]:w-full xl:grid-cols-[minmax(0,1.62fr)_minmax(260px,1fr)] xl:items-start`;

/** Overview split columns — full width when stacked; grid constrains at xl+. */
export const pageOverviewMainClass = `min-w-0 w-full max-w-none ${appStackClass}`;

export const pageOverviewAsideClass = `min-w-0 w-full max-w-none lg:max-w-none ${appStackClass} [&>*]:w-full`;

/** Horizontal scroll wrapper for wide data tables. */
export const responsiveTableScrollClass = "overflow-x-auto scrollbar-dark";

export const pageMainClass = appMainClass;

export const pageAsideClass = `min-w-0 ${appStackClass} lg:max-w-sm xl:max-w-none`;
