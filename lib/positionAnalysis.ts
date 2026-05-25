export const ANALYZE_POSITION_EVENT = "tomcrest:analyze-position";
export const ANALYZE_PORTFOLIO_EVENT = "tomcrest:analyze-portfolio";
export const SYMBOL_ANALYSIS_SECTION_ID = "symbol-analysis";
export const PORTFOLIO_ANALYSIS_SECTION_ID = "portfolio-analysis";

/** @deprecated Use SYMBOL_ANALYSIS_SECTION_ID */
export const SYMBOL_INSIGHTS_SECTION_ID = SYMBOL_ANALYSIS_SECTION_ID;

export function requestPositionAnalysis(symbol?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(ANALYZE_POSITION_EVENT, {
      detail: { symbol: symbol?.toUpperCase() },
    }),
  );

  scrollToAnalysisSection(SYMBOL_ANALYSIS_SECTION_ID);
}

export function requestPortfolioAnalysis() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(ANALYZE_PORTFOLIO_EVENT));
}

function scrollToAnalysisSection(sectionId: string) {
  window.requestAnimationFrame(() => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
