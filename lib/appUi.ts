/**
 * In-app design tokens (research, portfolio, chat). Marketing pages use `.marketing-*`.
 * ClawHub-inspired: dark grid, mono labels, uniform panels.
 */

/** Vertical rhythm between sections (16px). */
export const appStackClass = "flex flex-col gap-4";

export const appStackSmClass = "flex flex-col gap-3";

/** Page main column inside shell. */
export const appMainClass = `min-w-0 ${appStackClass}`;

/** Primary + sidebar split. */
export const appSplitClass =
  "grid gap-4 lg:grid-cols-[minmax(0,1.62fr)_minmax(240px,1fr)] lg:items-start lg:gap-4";

export const appPanelClass = "app-panel w-full max-w-none";

export const appPanelSubtleClass = "app-panel app-panel--subtle w-full max-w-none";

export const appPanelHeaderClass = "app-panel__header";

export const appPanelBodyClass = "app-panel__body";

export const appPanelBodyLgClass = "app-panel__body app-panel__body--lg";

export const appIconBoxClass = "app-icon-box";

export const appEyebrowClass = "app-eyebrow";

export const appHighlightClass = "app-highlight";

export const appTabBarClass = "app-tab-bar";

export const appTabLinkClass = (active: boolean) =>
  active ? "app-tab-link app-tab-link--active" : "app-tab-link";

export const appChromeClass = "app-chrome";

export const appSidebarClass = "app-sidebar";

export const appCanvasClass = "app-canvas min-w-0 flex-1";
