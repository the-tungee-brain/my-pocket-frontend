import {
  captureEvent,
  identifyUser,
  type CaptureProperties,
} from "@/lib/posthogClient";

export type AnalyticsProperties = CaptureProperties;

export function identify(userId: string, traits?: AnalyticsProperties) {
  identifyUser(userId, traits);
}

export function track(event: string, properties?: AnalyticsProperties) {
  captureEvent(event, properties);
}
