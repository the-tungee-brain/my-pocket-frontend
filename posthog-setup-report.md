<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Tomcrest, a Next.js App Router application. The existing custom REST-based analytics wrapper (`lib/analytics.ts`) has been migrated to use the `posthog-js` SDK, giving the app session replay, automatic error tracking (`capture_exceptions`), and proper session management with no double-counting. PostHog is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), and all events are routed through a reverse proxy at `/ingest` to avoid ad blockers. Four new events were added to cover key conversion and engagement signals not previously tracked.

| Event | Description | File |
|---|---|---|
| `sign_in_clicked` | User clicks "Sign in with Google" on the landing page — top of acquisition funnel | `components/AuthPage.tsx` |
| `onboarding_dismissed` | User dismisses the getting-started checklist before completing all core steps | `components/PortfolioOnboarding.tsx` |
| `watchlist_symbol_toggled` | User adds or removes a symbol from their watchlist (action: added/removed, symbol) | `app/hooks/useWatchlistToggle.ts` |
| `quick_action_used` | User triggers a quick action in the AI chat sidebar (action_id, view, symbol) | `app/Providers.tsx` |

**Previously instrumented events** (now routed through posthog-js SDK):

| Event | Description | File |
|---|---|---|
| `sign_in_completed` | User authenticated via Google OAuth | `components/ProductAnalytics.tsx` |
| `positions_loaded` | Schwab portfolio positions fetched successfully | `app/Providers.tsx` |
| `schwab_connect_completed` | Schwab OAuth connection flow finished | `app/Providers.tsx` |
| `ai_message_sent` | User sent a free-form message to the AI chat | `app/Providers.tsx` |
| `morning_brief_viewed` | Morning brief loaded and displayed | `app/hooks/useMorningBrief.ts` |
| `schwab_connect_started` | User initiated the Schwab OAuth connection flow | `app/hooks/useSchwabConnect.ts` |
| `schwab_connect_failed` | Schwab connection flow failed with an error | `app/hooks/useSchwabConnect.ts` |
| `research_symbol_opened` | User opened a symbol in the Research section | `app/research/[symbol]/ResearchSymbolShell.tsx` |

**Files created or modified:**

- `instrumentation-client.ts` — PostHog client-side initialization (posthog-js, reverse proxy, error tracking)
- `next.config.ts` — Reverse proxy rewrites for `/ingest` → PostHog ingestion endpoints
- `lib/analytics.ts` — Migrated from raw fetch to `posthog.capture()` / `posthog.identify()`
- `.env.local` — `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1633948)
- [User Acquisition Funnel](/insights/bQJLMvZW) — sign_in_clicked → sign_in_completed conversion rate
- [Schwab Connection Funnel](/insights/Sg5CdkB8) — schwab_connect_started → schwab_connect_completed conversion rate
- [Daily Active Users](/insights/al9Q73iz) — unique users sending AI messages per day
- [AI Chat & Quick Actions Usage](/insights/sU4Exxtf) — free-form messages vs quick actions over time
- [Research & Watchlist Engagement](/insights/85RaJ4ln) — symbol research opens and watchlist toggles over time

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
