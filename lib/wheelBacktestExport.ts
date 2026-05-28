export type WheelBacktestRunParams = {
  symbol: string;
  lookbackYears: number;
  targetDeltaMin: number;
  targetDeltaMax: number;
  dteDays: number;
  maintainOneLot: boolean;
};

export {
  downloadWheelBacktestPdf as downloadWheelBacktestResult,
  wheelBacktestPdfFilename as wheelBacktestDownloadFilename,
} from "@/lib/wheelBacktestPdf";
