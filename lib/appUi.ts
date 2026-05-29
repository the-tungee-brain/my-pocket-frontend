/**
 * In-app design tokens (research, portfolio, chat). Marketing uses `.marketing-*`.
 */

/** Standard vertical gap between sections (20px). */
export const appGapClass = "gap-5";

/** Tighter gap for dense sub-sections (12px). */
export const appGapSmClass = "gap-3";

export const appStackClass = `flex flex-col ${appGapClass}`;

export const appStackSmClass = `flex flex-col ${appGapSmClass}`;

export const appMainClass = `min-w-0 ${appStackClass}`;

export const appSplitClass =
  `grid ${appGapClass} lg:grid-cols-[minmax(0,1.62fr)_minmax(260px,1fr)] lg:items-start`;

export const appPanelClass = "app-panel w-full max-w-none";

export const appPanelSubtleClass = "app-panel app-panel--subtle w-full max-w-none";

export const appPanelHeaderClass = "app-panel__header";

export const appPanelBodyClass = "app-panel__body";

export const appPanelBodyLgClass = "app-panel__body app-panel__body--lg";

export const appPanelFooterClass = "app-panel__footer";

export const appIconBoxClass = "app-icon-box";

export const appEyebrowClass = "app-eyebrow";

export const appSectionLabelClass = "app-section-label";

export const appHighlightClass = "app-highlight";

/** Muted callout — matches Strategy playbook “Next up”. */
export const appCalloutClass = "rounded-xl bg-muted-bg/60 px-3 py-3";

export const appCalloutLabelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted";

export const appInsetClass = "app-inset";

export const appKpiClass = "app-kpi";

export const appChipClass = "app-chip";

export const appStatGridClass = "app-stat-grid";

/** Portfolio Today: morning brief + strategy playbook (stacks below md). */
export const portfolioTodayPairGridClass = "grid grid-cols-1 gap-5";

export const portfolioTodayPairGridPairedClass =
  "lg:grid-cols-2 lg:items-start";

export const appListClass = "app-list";

export const appListRowClass = "app-list-row";

export const appTabBarClass = "app-tab-bar";

export const appTabLinkClass = (active: boolean) =>
  active ? "app-tab-link app-tab-link--active" : "app-tab-link";

export const appChromeClass = "app-chrome";

export const appSidebarClass = "app-sidebar";

export const appCanvasClass = "app-canvas min-w-0 flex-1";
