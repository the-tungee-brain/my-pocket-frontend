import type { Position } from "@/app/types/schwab";
import {
  buildInsightsCacheKey,
  readInsightsCache,
} from "@/lib/insightsCache";

export const ANALYZE_POSITION_EVENT = "tomcrest:analyze-position";
export const ANALYZE_PORTFOLIO_EVENT = "tomcrest:analyze-portfolio";
export const SYMBOL_ANALYSIS_SECTION_ID = "symbol-analysis";
export const PORTFOLIO_ANALYSIS_SECTION_ID = "portfolio-analysis";
export const MAIN_CONTENT_ID = "main-content";

/** @deprecated Use SYMBOL_ANALYSIS_SECTION_ID */
export const SYMBOL_INSIGHTS_SECTION_ID = SYMBOL_ANALYSIS_SECTION_ID;

export type PortfolioAnalysisRequestDetail = {
  forceAnalyze?: boolean;
};

export function hasPortfolioAnalysis(positions: Position[]): boolean {
  if (!positions.length) return false;

  const cacheKey = buildInsightsCacheKey("PORTFOLIO", positions, true);
  return !!readInsightsCache(cacheKey, "PORTFOLIO");
}

export function requestPositionAnalysis(symbol?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(ANALYZE_POSITION_EVENT, {
      detail: { symbol: symbol?.toUpperCase() },
    }),
  );

  scrollToAnalysisSection(SYMBOL_ANALYSIS_SECTION_ID);
}

export function goToPortfolioAnalysis(
  options?: PortfolioAnalysisRequestDetail,
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<PortfolioAnalysisRequestDetail>(ANALYZE_PORTFOLIO_EVENT, {
      detail: { forceAnalyze: options?.forceAnalyze ?? true },
    }),
  );

  scrollToAnalysisSection(PORTFOLIO_ANALYSIS_SECTION_ID);
}

export function requestPortfolioAnalysis() {
  goToPortfolioAnalysis({ forceAnalyze: true });
}

function readScrollMarginTop(element: HTMLElement): number {
  const value = getComputedStyle(element).scrollMarginTop;
  if (!value || value === "auto") return 0;
  if (value.endsWith("rem")) {
    return Number.parseFloat(value) * 16;
  }
  if (value.endsWith("px")) {
    return Number.parseFloat(value);
  }
  return Number.parseFloat(value) || 0;
}

function scrollMainContentToTarget(target: HTMLElement) {
  const root = document.getElementById(MAIN_CONTENT_ID);
  if (!root || root.scrollHeight <= root.clientHeight + 1) return;

  const scrollMargin = readScrollMarginTop(target);
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    root.scrollTop + (targetRect.top - rootRect.top) - scrollMargin;
  root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
}

export function scrollToAnalysisSection(sectionId: string) {
  const scrollOnce = (): boolean => {
    const target = document.getElementById(sectionId);
    if (!target) return false;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollMainContentToTarget(target);
    return true;
  };

  const scheduleScroll = (delayMs: number, attemptsLeft = 0) => {
    window.setTimeout(() => {
      if (scrollOnce()) {
        if (attemptsLeft > 0) {
          scheduleScroll(80, attemptsLeft - 1);
        }
        return;
      }
      if (attemptsLeft > 0) {
        scheduleScroll(50, attemptsLeft - 1);
      }
    }, delayMs);
  };

  window.requestAnimationFrame(scrollOnce);
  scheduleScroll(0, 10);
  scheduleScroll(200);
  scheduleScroll(500);
  scheduleScroll(900);
}
