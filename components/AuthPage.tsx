"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { TrendingUp, BrainCircuit, ShieldCheck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-black via-zinc-950 to-zinc-900 text-white font-sans">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 lg:flex-row lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 shadow-lg">
            AI-Powered Portfolio Intelligence
          </div>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Analyze Your Portfolio with
            <span className="bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}
              AI-Powered Insights
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            PowerPocket combines real-time brokerage data, market news,
            financial fundamentals, and AI analysis to help investors make
            smarter portfolio decisions.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Real-Time Portfolio Tracking"
              description="Connect brokerage accounts to monitor holdings, positions, and portfolio performance."
            />

            <FeatureCard
              icon={<BrainCircuit className="h-6 w-6" />}
              title="AI Investment Analysis"
              description="Generate AI-powered buy, hold, sell, and risk-management recommendations."
            />

            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Financial & Market Insights"
              description="Analyze company fundamentals, earnings, market trends, and financial news."
            />

            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Secure Brokerage Integration"
              description="Securely integrate brokerage APIs for real-time investment intelligence."
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button
              onClick={() => signIn("google")}
              className="h-12 rounded-xl px-8 text-base"
              size="default"
            >
              Sign in with Google
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mt-16 flex-1 lg:mt-0"
        >
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Portfolio Value</p>
                <h2 className="text-4xl font-bold">$248,420</h2>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-emerald-400">
                +12.4%
              </div>
            </div>

            <div className="space-y-4">
              <PortfolioRow
                symbol="NVDA"
                action="BUY"
                summary="Strong AI growth momentum and positive earnings outlook."
              />

              <PortfolioRow
                symbol="AAPL"
                action="HOLD"
                summary="Stable cash flow with moderate upside potential."
              />

              <PortfolioRow
                symbol="TSLA"
                action="REDUCE"
                summary="High volatility and elevated valuation risk detected."
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg backdrop-blur transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}

function PortfolioRow({
  symbol,
  action,
  summary,
}: {
  symbol: string;
  action: string;
  summary: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{symbol}</h3>
          <p className="mt-1 text-sm text-zinc-400">{summary}</p>
        </div>

        <div
          className={`rounded-xl px-3 py-1 text-sm font-medium ${
            action === "BUY"
              ? "bg-emerald-500/10 text-emerald-400"
              : action === "HOLD"
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-red-500/10 text-red-400"
          }`}
        >
          {action}
        </div>
      </div>
    </div>
  );
}
