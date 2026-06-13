import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const tabBar = readFileSync(
  new URL("../components/ResearchTabBar.tsx", import.meta.url),
  "utf8",
);
const positionContent = readFileSync(
  new URL("../components/SymbolPositionContent.tsx", import.meta.url),
  "utf8",
);
const overviewEvidence = readFileSync(
  new URL(
    "../components/research/ResearchOverviewEvidence.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Research tabs promote decision horizons next to overview and hide analysis", () => {
  const overviewIndex = tabBar.indexOf('id: "overview"');
  const dayTradeIndex = tabBar.indexOf('id: "day-trade"');
  const swingTradeIndex = tabBar.indexOf('id: "swing-trade"');
  const longTermIndex = tabBar.indexOf('id: "long-term"');
  const positionIndex = tabBar.indexOf('id: "position"');

  assert.ok(overviewIndex > -1);
  assert.ok(dayTradeIndex > overviewIndex);
  assert.ok(swingTradeIndex > dayTradeIndex);
  assert.ok(longTermIndex > swingTradeIndex);
  assert.ok(positionIndex > longTermIndex);
  assert.ok(!tabBar.includes('id: "analysis"'));
  assert.ok(!tabBar.includes('label: "Analysis"'));
});

test("Research overview links no longer target removed analysis tab", () => {
  assert.ok(!positionContent.includes('symbolHubPath(symbol, "analysis")'));
  assert.ok(!overviewEvidence.includes('symbolHubPath(symbol, "analysis")'));
});
