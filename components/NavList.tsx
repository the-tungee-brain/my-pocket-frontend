"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "./ui/Button";

export type MainView = "portfolio" | "symbol" | "research";

interface NavListProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
  containerClassName?: string;
  portfolioButtonClassName?: string;
  symbolButtonClassName?: string;
}

export function NavList({
  loading,
  symbols,
  setSelectedSymbol,
  setSelectedView,
  containerClassName = "",
  portfolioButtonClassName = "",
  symbolButtonClassName = "",
}: NavListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const { authorized: schwabAuthorized, loading: schwabLoading } =
    useSchwabStatus();

  const isPortfolio = pathname === "/portfolio";
  const isResearch = pathname.startsWith("/research");
  const activeSymbol = pathname.startsWith("/portfolio/positions/")
    ? pathname.split("/").at(-1)
    : null;

  const showSchwabStatus =
    schwabAuthorized !== null && schwabAuthorized !== undefined;

  const handleConnectSchwab = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await apiFetch("/auth/schwab/connect", {
        method: "GET",
        accessToken: session.accessToken,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { auth_url: string };
      window.location.href = data.auth_url;
    } catch {}
  };

  return (
    <div
      className={[
        "flex h-full flex-col rounded-2xl bg-secondary/60 py-3",
        containerClassName,
      ].join(" ")}
    >
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setSelectedView("research");
          setSelectedSymbol(null);
          router.replace("/research");
        }}
        className={[
          "group mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isResearch
            ? "bg-neutral-800 text-neutral-50 shadow-inner"
            : "text-neutral-300 hover:bg-neutral-800/60",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isResearch
              ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300"
              : "border-neutral-700 bg-neutral-900/60 text-neutral-300",
          ].join(" ")}
        >
          R
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>Research</span>
        </div>
        {isResearch && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setSelectedView("portfolio");
          setSelectedSymbol(null);
          router.replace("/portfolio");
        }}
        className={[
          "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isPortfolio
            ? "bg-neutral-800 text-neutral-50 shadow-inner"
            : "text-neutral-300 hover:bg-neutral-800/60",
          portfolioButtonClassName,
        ].join(" ")}
      >
        <span
          className={[
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isPortfolio
              ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300"
              : "border-neutral-700 bg-neutral-900/60 text-neutral-300",
          ].join(" ")}
        >
          P
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>My portfolio</span>
          <span className="truncate text-[10px] text-neutral-500">
            Overview
          </span>
        </div>
        {isPortfolio && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      <div className="my-3 h-px bg-neutral-800/80" />

      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Positions
        </span>
        {symbols.length > 0 && (
          <span className="rounded-full bg-neutral-900/70 px-2 py-px text-[10px] text-neutral-400">
            {symbols.length}
          </span>
        )}
      </div>

      {loading && (
        <div className="px-2 py-2 text-[11px] text-neutral-500">
          Loading symbols…
        </div>
      )}

      {!loading && symbols.length === 0 && (
        <div className="px-2 py-2 text-[11px] text-neutral-500">
          No symbols yet. Connect Schwab to load holdings.
        </div>
      )}

      <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-1">
        {symbols.map((sym) => {
          const isActive = activeSymbol === sym;

          return (
            <button
              key={sym}
              type="button"
              disabled={loading}
              onClick={() => {
                setSelectedView("symbol");
                setSelectedSymbol(sym);
                router.replace(`/portfolio/positions/${sym}`);
              }}
              className={[
                "group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-all",
                isActive
                  ? "bg-neutral-800 text-neutral-50 shadow-inner"
                  : "text-neutral-300 hover:bg-neutral-800/60",
                symbolButtonClassName,
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs font-mono">{sym}</span>
              </span>

              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {showSchwabStatus && (
        <>
          <div className="mt-3 h-px bg-neutral-800/80" />
          <div className="mt-2 px-4 text-[11px]">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Schwab
              </span>
              <span
                className={
                  schwabAuthorized
                    ? "inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
                    : "inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400"
                }
              >
                {schwabLoading
                  ? "Checking…"
                  : schwabAuthorized
                    ? "Connected"
                    : "Not connected"}
              </span>
            </div>

            {!schwabAuthorized && !schwabLoading && (
              <Button
                size="xs"
                variant="outline"
                className="w-full"
                onClick={handleConnectSchwab}
              >
                Connect
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
