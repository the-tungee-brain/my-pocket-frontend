import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appShell = readFileSync(new URL("../app/AppShell.tsx", import.meta.url), "utf8");
const instrumentation = readFileSync(
  new URL("../lib/chatIsolationInstrumentation.ts", import.meta.url),
  "utf8",
);
const researchSnapshot = readFileSync(
  new URL("../lib/researchSnapshot.ts", import.meta.url),
  "utf8",
);
const tickerKeyStats = readFileSync(
  new URL("../lib/tickerKeyStats.ts", import.meta.url),
  "utf8",
);

test("AppShell keeps chat context out of the page shell", () => {
  const shellBody = appShell.slice(
    appShell.indexOf("export function AppShell"),
    appShell.indexOf("function AssistantChatController"),
  );

  assert.ok(shellBody.includes("<AssistantChatController"));
  assert.ok(!shellBody.includes("useAppChatContext()"));
  assert.ok(!shellBody.includes("chatBySymbol"));
});

test("page children remain behind a stable memo boundary", () => {
  assert.ok(appShell.includes("const StablePageContent = memo"));
  assert.ok(appShell.includes("<StablePageContent>{children}</StablePageContent>"));
});

test("chat query instrumentation uses isolated chat keys", () => {
  for (const key of ["aiChatContext", "aiChatStream", "aiChatHistory"]) {
    assert.ok(instrumentation.includes(`"${key}"`));
  }

  for (const pageKey of ["portfolio", "research", "watchlist", "symbolIntelligence"]) {
    assert.ok(instrumentation.includes(`"${pageKey}"`));
  }

  assert.ok(instrumentation.includes("classifyQueryKey"));
  assert.ok(instrumentation.includes("trigger: source === \"chat\" ? \"chat\""));
});

test("AAPL-style legacy dividend yield is repaired before display", () => {
  assert.ok(researchSnapshot.includes("function normalizeDividendYieldPct"));
  assert.ok(researchSnapshot.includes("if (value > 25 && value <= 100) return value / 100;"));
  assert.ok(tickerKeyStats.includes("if (value <= 100) return formatSnapshotPercent(value / 100);"));
  assert.ok(!tickerKeyStats.includes("Check source"));
});
