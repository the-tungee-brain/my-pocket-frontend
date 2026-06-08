import assert from "node:assert/strict";
import { test } from "node:test";
import newsBriefingRules from "../lib/newsBriefingRules.js";

const {
  rankHeadlines,
  thesisBuckets,
  verdictText,
  whatChangedItems,
} = newsBriefingRules;

function item(overrides) {
  return {
    id: Math.floor(Math.random() * 1_000_000),
    datetime: "2026-06-08T12:00:00.000Z",
    headline: "Amazon expands AWS custom AI chip rollout",
    source: "Reuters",
    summary: "Amazon said Trainium adoption could improve AWS cost structure.",
    sentiment: "bullish",
    confidence: 0.86,
    topics: ["custom_ai_chips"],
    directRelevance: "direct_company_news",
    thesisImpact: "high",
    thesisHorizon: "long_term",
    feedKind: "coverage",
    ...overrides,
  };
}

function assertNotMaterial(headline, summary = "") {
  const ranked = rankHeadlines(
    [
      item({
        headline,
        summary,
        source: "PRNewswire",
        directRelevance: "direct_company_news",
        thesisImpact: "high",
        topics: [],
      }),
    ],
    "AMZN",
  );
  assert.equal(
    ranked.some((entry) => entry.rank === "Material"),
    false,
    headline,
  );
}

test("AMZN weak mentions are never ranked Material", () => {
  assertNotMaterial("BlockchAIn hires former Amazon veteran as chief revenue officer");
  assertNotMaterial("ReelTime says its platform compares itself to Amazon Prime");
  assertNotMaterial("Gadget maker launches new device available on Amazon");
  assertNotMaterial("Wonder and Grubhub announce Alexa+ integration");
  assertNotMaterial("Supplier expands sales channel through Amazon Marketplace");
});

test("strict AMZN thesis stories can still rank Material", () => {
  const ranked = rankHeadlines(
    [
      item({
        headline: "Amazon expands custom AI chip deployment across AWS",
        summary:
          "The Trainium rollout could lower inference costs and strengthen AWS competitive position.",
      }),
    ],
    "AMZN",
  );

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].rank, "Material");
});

test("opportunities do not use placeholder synthesis language", () => {
  const ranked = rankHeadlines(
    [
      item({
        headline: "Amazon expands custom AI chip deployment across AWS",
        summary:
          "The Trainium rollout could lower inference costs and strengthen AWS competitive position.",
      }),
      item({
        headline: "Small vendor says its product is available on Amazon",
        summary: "The vendor mentioned Amazon as a sales channel.",
        source: "PRNewswire",
        topics: [],
        directRelevance: "direct_company_news",
        thesisImpact: "high",
      }),
    ],
    "AMZN",
  );
  const buckets = thesisBuckets({ insights: [], risks: [] }, ranked);
  const opportunities = buckets.opportunities.join(" ");

  assert.match(opportunities, /Custom AI chips could improve AWS cost structure/);
  assert.doesNotMatch(opportunities, /company-specific development/i);
  assert.doesNotMatch(opportunities, /company-specific news around/i);
});

test("what changed is concise and avoids paragraph-like output", () => {
  const ranked = rankHeadlines([item({})], "AMZN");
  const lines = whatChangedItems(
    {
      investorTakeaway:
        "Long-term positive. AI/cloud coverage supports the long-term thesis, but there is no major near-term catalyst. Extra sentence should not appear.",
      insights: [],
      risks: [],
    },
    ranked,
  );

  assert.ok(lines.length > 0);
  for (const line of lines) {
    assert.ok(line.length <= 150, line);
    assert.equal((line.match(/[.!?]/g) ?? []).length <= 1, true, line);
  }
});

test("verdict summary does not duplicate the verdict label", () => {
  const summary = verdictText(
    {
      aiEnrichment: true,
      overall_sentiment: "bullish",
      investorTakeaway:
        "Long-term positive. AI/cloud coverage supports the long-term thesis, but there is no major near-term catalyst.",
      summary: "Long-term positive.",
    },
    2,
    4,
  );

  assert.equal(summary.startsWith("Long-term positive"), false);
  assert.match(summary, /AI\/cloud coverage supports/);
});
