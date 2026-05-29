export type PressReleaseHeadline = {
  headline: string;
  summary?: string | null;
  source: string;
  datetime: string;
  url?: string | null;
};

export type PressReleasesResponse = {
  symbol: string;
  items: PressReleaseHeadline[];
};
