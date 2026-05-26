/** Shared max-width for primary app surfaces (portfolio, research, chat). */
export const pageShellClass =
  "mx-auto w-full max-w-6xl 2xl:max-w-7xl";

/** Narrower shell for form-heavy pages (settings, onboarding). */
export const pageFormClass = "mx-auto w-full max-w-2xl";

/** Drop per-card max-width when a section sits inside {@link pageShellClass}. */
export const pageSectionClass = "mx-0 w-full max-w-none";

/** Primary + sidebar split for dashboard-style pages. */
export const pageSplitClass =
  "grid gap-6 lg:grid-cols-[minmax(0,1.62fr)_minmax(280px,1fr)] lg:items-start";

export const pageMainClass = "min-w-0 space-y-4";

export const pageAsideClass = "min-w-0 space-y-4";
