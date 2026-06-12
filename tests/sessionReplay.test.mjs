import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");

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

function loadTradeReplayModule() {
  const { outputText } = ts.transpileModule(replayLib, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Function("exports", "module", outputText)(module.exports, module);
  return module.exports;
}

const tradeReplay = loadTradeReplayModule();

function replayEvent(overrides = {}) {
  return {
    id: overrides.id ?? "event-1",
    symbol: "AAPL",
    event_date: "2026-06-12",
    workflow: "day_trade",
    event_type: "long_trigger_activated",
    event_time: "2026-06-12T13:30:00.000Z",
    message: "Long breakout triggered.",
    severity: "important",
    actionability: "active",
    source: "realtime",
    ...overrides,
  };
}

test("Session Replay API contract uses requested endpoints", () => {
  assert.ok(apiClient.includes("/research/trade-replay"));
  assert.ok(apiClient.includes("/research/trade-replay/refresh"));
  assert.ok(apiClient.includes("/research/trade-replay/missed-moves"));
  assert.ok(apiClient.includes("workflow: options.workflow"));
  assert.ok(apiClient.includes("date: options.date"));
  assert.ok(apiClient.includes("missed_move_id"));
});

test("Session Replay resolves through api/v1 base without double prefix", () => {
  assert.ok(config.includes("/api/v1"));
  assert.match(apiClient, /`\$\{API_BASE_URL\}\$\{path\}`/);
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

test("Missed Moves summary loads before historical replay timelines", () => {
  assert.ok(hook.includes("fetchMissedMovesSummary"));
  assert.ok(hook.includes('"missed-moves-summary"'));
  assert.ok(section.includes('range === "last_5_trading_days"'));
  assert.ok(section.includes("useMissedMovesSummary"));
  assert.ok(section.includes("selectedRow?.id"));
  assert.ok(section.includes("refreshOnLoad: false"));
});

test("Session Replay normalizes chronological deduped events", () => {
  assert.ok(replayLib.includes(".sort((left, right) => eventTimestamp(left) - eventTimestamp(right))"));
  assert.ok(replayLib.includes("const seen = new Set<string>()"));
  assert.ok(replayLib.includes("replayDedupeKey"));
});

test("Session Replay classifies market sessions from America/New_York time", () => {
  assert.equal(
    tradeReplay.replaySessionLabel("2026-06-12T07:10:00.000Z"),
    "Pre-market session ET",
  );
  assert.equal(
    tradeReplay.replaySessionLabel("2026-06-12T13:30:00.000Z"),
    "Regular session ET",
  );
  assert.equal(
    tradeReplay.replaySessionLabel("2026-06-12T19:59:00.000Z"),
    "Regular session ET",
  );
  assert.equal(
    tradeReplay.replaySessionLabel("2026-06-12T20:00:00.000Z"),
    "After-hours session ET",
  );
});

test("Session Replay renders UTC timestamps in America/New_York", () => {
  assert.equal(
    tradeReplay.formatReplayEventTime("2026-01-15T14:30:00.000Z"),
    "9:30 AM ET",
  );
  assert.equal(
    tradeReplay.formatReplayEventTime("2026-06-12T07:10:00.000Z"),
    "3:10 AM ET",
  );
});

test("Session Replay prefers market event_time over ingestion created_at", () => {
  const response = tradeReplay.normalizeTradeReplayResponse({
    symbol: "AAPL",
    date: "2026-06-12",
    workflow: "day_trade",
    source: "realtime",
    events: [
      replayEvent({
        event_time: "2026-06-12T07:10:00.000Z",
        created_at: "2026-06-12T13:30:00.000Z",
      }),
    ],
  });

  assert.equal(response.events[0].event_time, "2026-06-12T07:10:00.000Z");
  assert.equal(
    tradeReplay.replaySessionLabel(response.events[0].event_time),
    "Pre-market session ET",
  );
});

test("Session Replay collapses same-candle trigger and invalidation", () => {
  const response = tradeReplay.normalizeTradeReplayResponse({
    symbol: "AAPL",
    date: "2026-06-12",
    workflow: "day_trade",
    source: "realtime",
    events: [
      replayEvent({
        id: "trigger",
        event_type: "long_trigger_activated",
        event_time: "2026-06-12T13:35:10.000Z",
      }),
      replayEvent({
        id: "failed",
        event_type: "opening_range_failed",
        event_time: "2026-06-12T13:35:45.000Z",
        message: "Price failed back inside the opening range.",
        severity: "warning",
        actionability: "invalidated",
      }),
    ],
  });

  assert.equal(response.events.length, 1);
  assert.equal(response.events[0].event_type, "long_breakout_failed_same_candle");
  assert.equal(response.events[0].actionability, "invalidated");
  assert.equal(
    response.events[0].message,
    "Long breakout triggered but immediately failed back inside the opening range.",
  );
});

test("Session Replay UI uses review language and delayed-data guardrail", () => {
  assert.ok(section.includes("Today’s Missed Moves"));
  assert.ok(section.includes("No qualifying missed moves in the selected period."));
  assert.ok(section.includes("Replay uses delayed/polled data"));
  assert.ok(section.includes("formatReplayEventTime"));
  assert.ok(section.includes("replaySessionLabel"));
  assert.ok(section.includes("Last 5 Trading Days"));
  assert.ok(section.includes("Most recent"));
  assert.ok(section.includes("Biggest move"));
  assert.ok(section.includes("Highest setup quality"));
  assert.ok(section.includes("Target Hit"));
  assert.ok(section.includes("Extended"));
  assert.ok(section.includes("Invalidated"));
  assert.ok(section.includes("Stopped"));
  assert.ok(replayLib.includes('const MARKET_TIME_ZONE = "America/New_York"'));
  assert.ok(replayLib.includes("Pre-market session ET"));
  assert.ok(replayLib.includes("After-hours session ET"));
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
