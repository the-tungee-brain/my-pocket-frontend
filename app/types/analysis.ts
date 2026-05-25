export type StructuredAnalysisAction = {
  title: string;
  reason: string;
  symbol?: string | null;
};

export type StructuredAnalysisSection = {
  id?: string;
  title: string;
  body?: string | null;
  bullets?: string[];
};

export type StructuredAnalysis = {
  summary: string;
  recommendedAction?: StructuredAnalysisAction | null;
  sections: StructuredAnalysisSection[];
};
