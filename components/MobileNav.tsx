"use client";

import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet } from "lucide-react";
import { NavList, MainView } from "@/components/NavList";

import type { SymbolAlertSummary } from "@/lib/intelligence";

interface MobileNavProps {
  mobileNavOpen: boolean;
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
  symbolAlertMap?: Record<string, SymbolAlertSummary>;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function MobileNav({
  mobileNavOpen,
  setMobileNavOpen,
  loading,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
  selectedView,
  setSelectedView,
  symbolAlertMap,
}: MobileNavProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleSetView = (v: MainView) => {
    setSelectedView(v);
    setMobileNavOpen(false);
  };

  const handleSetSymbol = (s: string | null) => {
    setSelectedSymbol(s);
    if (s != null) {
      setSelectedView("symbol");
    }
    setMobileNavOpen(false);
  };

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileNavOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusables = getFocusableElements(panelRef.current);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [mobileNavOpen, setMobileNavOpen]);

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <motion.button
            type="button"
            aria-label="Close mobile navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />

          <motion.aside
            ref={panelRef}
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-50 flex h-full w-72 flex-col border-r border-border bg-secondary shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <div
                    id="mobile-nav-title"
                    className="text-sm font-semibold tracking-tight"
                  >
                    Tomcrest
                  </div>
                  <div className="text-[10px] text-muted">
                    Portfolio workspace
                  </div>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-muted transition hover:bg-muted-bg hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex-1 overflow-y-auto px-2 py-3 scrollbar-dark"
              aria-label="Main navigation"
            >
              <NavList
                loading={loading}
                symbols={symbols}
                selectedSymbol={selectedSymbol}
                setSelectedSymbol={handleSetSymbol}
                selectedView={selectedView}
                setSelectedView={handleSetView}
                symbolAlertMap={symbolAlertMap}
                containerClassName="flex flex-col gap-2"
                portfolioButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm font-medium transition-colors"
                symbolButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm transition-colors"
              />
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
