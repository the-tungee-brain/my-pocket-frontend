import type { WheelBacktestCallStrikeMode } from "@/app/types/wheelBacktest";
import type { WheelBacktestDteDays } from "@/lib/wheelBacktestDte";

export type WheelBacktestRunParams = {
  symbol: string;
  lookbackYears: number;
  targetDeltaMin: number;
  targetDeltaMax: number;
  dteDays: WheelBacktestDteDays;
  maintainOneLot: boolean;
  callStrikeMode: WheelBacktestCallStrikeMode;
};

export {
  downloadWheelBacktestPdf as downloadWheelBacktestResult,
  wheelBacktestPdfFilename as wheelBacktestDownloadFilename,
} from "@/lib/wheelBacktestPdf";
