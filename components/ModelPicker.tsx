"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  CHAT_MODEL_OPTIONS,
  CHAT_MODEL_TIERS,
  type ChatModelOption,
} from "@/lib/chatModels";

type ModelPickerProps = {
  open: boolean;
  value: string;
  onChange: (modelId: string) => void;
};

function groupByTier(options: ChatModelOption[]) {
  return CHAT_MODEL_TIERS.map((tier) => ({
    ...tier,
    options: options.filter((option) => option.tier === tier.id),
  })).filter((group) => group.options.length > 0);
}

function preventScrollChaining(event: WheelEvent) {
  const list = event.currentTarget as HTMLDivElement;
  const { scrollTop, scrollHeight, clientHeight } = list;
  const delta = event.deltaY;
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

  if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
    event.preventDefault();
  }
  event.stopPropagation();
}

export function ModelPicker({ open, value, onChange }: ModelPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;

    list.addEventListener("wheel", preventScrollChaining, { passive: false });

    return () => {
      list.removeEventListener("wheel", preventScrollChaining);
    };
  }, [open]);

  if (!open) return null;

  const groups = groupByTier(CHAT_MODEL_OPTIONS);

  return (
    <div
      data-model-menu-root
      className="absolute bottom-full right-0 z-30 mb-2 w-[min(20rem,calc(100vw-2rem))] min-w-0 overscroll-contain rounded-2xl border border-border bg-secondary p-1 text-xs shadow-2xl backdrop-blur max-sm:left-0 max-sm:right-auto"
      role="listbox"
      aria-label="Choose AI model"
    >
      <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        AI model
      </div>
      <div
        ref={listRef}
        className="max-h-72 overflow-y-auto overscroll-contain py-1 scrollbar-dark"
      >
        {groups.map((group) => (
          <div key={group.id} className="px-1 pb-1">
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {group.label}
            </p>
            {group.options.map((option) => {
              const isActive = option.id === value;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange(option.id);
                  }}
                  className={cn(
                    "flex w-full flex-col rounded-md px-3 py-2 text-left transition-all duration-200 ease-out hover:bg-muted-bg",
                    isActive && "border border-border bg-muted-bg",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {option.id}
                    </span>
                    {isActive && (
                      <span className="shrink-0 rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold text-accent-strong">
                        Active
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 text-[11px] font-medium text-muted">
                    {option.label} · {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
