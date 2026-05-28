import type { WheelBacktestCallStrikeMode } from "@/app/types/wheelBacktest";

export type WheelBacktestRunParams = {
  symbol: string;
  lookbackYears: number;
  targetDeltaMin: number;
  targetDeltaMax: number;
  dteDays: number;
  maintainOneLot: boolean;
  callStrikeMode: WheelBacktestCallStrikeMode;
};

export {
  downloadWheelBacktestPdf as downloadWheelBacktestResult,
  wheelBacktestPdfFilename as wheelBacktestDownloadFilename,
} from "@/lib/wheelBacktestPdf";
