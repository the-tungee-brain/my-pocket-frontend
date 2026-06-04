export type ValidationBucketMetrics = {
  bucket: string;
  count: number;
  avgRet5D: number | null;
  avgRet10D: number | null;
  avgRet20D: number | null;
  avgExcess5D: number | null;
  avgExcess10D: number | null;
  avgExcess20D: number | null;
  hitRate5D: number | null;
  hitRate10D: number | null;
  hitRate20D: number | null;
};

export type EmergingLeadersValidationResponse = {
  snapshotDates: number;
  snapshotRows: number;
  labeledRows: number;
  setupScoreBuckets: ValidationBucketMetrics[];
  compressionVelocityBuckets: ValidationBucketMetrics[];
  stageBuckets: ValidationBucketMetrics[];
  topDecile: ValidationBucketMetrics;
  methodology: string;
};
