import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const apiClient = readFileSync(
  new URL("../lib/apiClient.ts", import.meta.url),
  "utf8",
);
const config = readFileSync(
  new URL("../lib/config.ts", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../app/hooks/useTradeReplay.ts", import.meta.url),
  "utf8",
);
const replayLib = readFileSync(
  new URL("../lib/tradeReplay.ts", import.meta.url),
  "utf8",
);
const section = readFileSync(
  new URL("../components/research/SessionReplaySection.tsx", import.meta.url),
  "utf8",
);
const horizonPages = readFileSync(
  new URL("../app/research/[symbol]/DecisionHorizonPages.tsx", import.meta.url),
  "utf8",
);

test("Session Replay API contract uses requested endpoints", () => {
  assert.ok(apiClient.includes("/research/trade-replay"));
  assert.ok(apiClient.includes("/research/trade-replay/refresh"));
  assert.ok(apiClient.includes("workflow: options.workflow"));
  assert.ok(apiClient.includes("date: options.date"));
});

test("Session Replay resolves through api/v1 base without double prefix", () => {
  assert.ok(config.includes("/api/v1"));
  assert.ok(apiClient.includes("`${API_BASE_URL}${path}`"));
  assert.ok(!apiClient.includes("/api/v1/research/trade-replay"));
});

test("Session Replay refreshes before fetching events", () => {
  const refreshIndex = hook.indexOf("await refreshTradeReplay");
  const fetchIndex = hook.indexOf("await fetchTradeReplay");

  assert.ok(refreshIndex > -1);
  assert.ok(fetchIndex > -1);
  assert.ok(refreshIndex < fetchIndex);
  assert.ok(hook.includes("refreshOnLoad = true"));
});

test("Session Replay normalizes chronological deduped events", () => {
  assert.ok(replayLib.includes(".sort((left, right) => eventTimestamp(left) - eventTimestamp(right))"));
  assert.ok(replayLib.includes("const seen = new Set<string>()"));
  assert.ok(replayLib.includes("replayDedupeKey"));
});

test("Session Replay UI uses review language and delayed-data guardrail", () => {
  assert.ok(section.includes("Today’s Missed Moves"));
  assert.ok(section.includes("No replay events yet."));
  assert.ok(section.includes("Replay uses delayed/polled data"));
  assert.ok(replayLib.includes("Still active"));
  assert.ok(!section.includes("should have bought"));
  assert.ok(!section.includes("should sell"));
});

test("Session Replay appears in Day Trade and Swing Trade placements", () => {
  assert.ok(horizonPages.includes('workflow="day_trade"'));
  assert.ok(horizonPages.includes('workflow="swing_trade"'));

  const dayTradeIndex = horizonPages.indexOf('workflow="day_trade"');
  const methodologyIndex = horizonPages.indexOf("<MethodologySection", dayTradeIndex);
  assert.ok(dayTradeIndex > -1);
  assert.ok(methodologyIndex > dayTradeIndex);

  const swingReplayIndex = horizonPages.indexOf('workflow="swing_trade"');
  const whyLevelsIndex = horizonPages.indexOf('title="Why These Levels"', swingReplayIndex);
  assert.ok(swingReplayIndex > -1);
  assert.ok(whyLevelsIndex > swingReplayIndex);
});
