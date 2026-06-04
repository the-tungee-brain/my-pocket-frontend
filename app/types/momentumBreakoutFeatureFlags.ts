export type MomentumBreakoutFeatureFlags = {
  alertsEnabled: boolean;
  alertCreationEnabled: boolean;
  alertNotificationsEnabled: boolean;
  paperAnalyticsEnabled: boolean;
};

export type MomentumBreakoutFeatureStatusResponse = {
  disclaimer: string;
  flags: MomentumBreakoutFeatureFlags;
};
