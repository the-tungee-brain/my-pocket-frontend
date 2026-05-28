"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  CHAT_MODEL_OPTIONS,
  CHAT_MODEL_TIERS,
  DEFAULT_CHAT_MODEL,
  requiresProModel,
  type ChatModelOption,
} from "@/lib/chatModels";
import { registerModelMenuRoot } from "@/lib/chatModelMenu";

type ModelPickerProps = {
  open: boolean;
  value: string;
  onChange: (modelId: string) => void;
  isPaid?: boolean;
  anchorRef: RefObject<HTMLElement | null>;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
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

function computeMenuPosition(anchor: HTMLElement): MenuPosition {
  const rect = anchor.getBoundingClientRect();
  const viewportPadding = 8;
  const gap = 8;
  const width = Math.min(320, window.innerWidth - viewportPadding * 2);
  const isMobile = window.innerWidth < 640;

  const left = isMobile
    ? viewportPadding
    : Math.min(
        Math.max(viewportPadding, rect.right - width),
        window.innerWidth - width - viewportPadding,
      );

  const spaceAbove = rect.top - viewportPadding - gap;
  const spaceBelow =
    window.innerHeight - rect.bottom - viewportPadding - gap;
  const openAbove = spaceAbove >= spaceBelow;

  if (openAbove) {
    const maxHeight = Math.max(160, Math.min(288, spaceAbove));
    return {
      top: Math.max(viewportPadding, rect.top - gap - maxHeight),
      left,
      width,
      maxHeight,
    };
  }

  const maxHeight = Math.max(160, Math.min(288, spaceBelow));
  return {
    top: rect.bottom + gap,
    left,
    width,
    maxHeight,
  };
}

export function ModelPicker({
  open,
  value,
  onChange,
  isPaid = false,
  anchorRef,
}: ModelPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      if (!anchorRef.current) return;
      setPosition(computeMenuPosition(anchorRef.current));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, isPaid]);

  useEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;

    list.addEventListener("wheel", preventScrollChaining, { passive: false });

    return () => {
      list.removeEventListener("wheel", preventScrollChaining);
    };
  }, [open, position]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    return registerModelMenuRoot(panel);
  }, [open, position]);

  if (!open || !mounted || !position) return null;

  const groups = groupByTier(CHAT_MODEL_OPTIONS);
  const listMaxHeight = Math.max(120, position.maxHeight - (isPaid ? 40 : 88));

  const menu = (
    <div
      ref={panelRef}
      data-model-menu-root
      role="listbox"
      aria-label="Choose AI model"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
      className="fixed z-[60] flex min-w-0 flex-col overscroll-contain rounded-2xl border border-border bg-secondary p-1 text-xs shadow-2xl backdrop-blur"
    >
      <div className="shrink-0 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        AI model
      </div>
      <div
        ref={listRef}
        style={{ maxHeight: listMaxHeight }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 scrollbar-dark"
      >
        {groups.map((group) => (
          <div key={group.id} className="px-1 pb-1">
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {group.label}
            </p>
            {group.options.map((option) => {
              const isActive = option.id === value;
              const locked = !isPaid && requiresProModel(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-disabled={locked}
                  disabled={locked}
                  onPointerDown={(event) => {
                    if (locked) {
                      event.preventDefault();
                      event.stopPropagation();
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    onChange(option.id);
                  }}
                  className={cn(
                    "flex w-full flex-col rounded-md px-3 py-2 text-left transition-all duration-200 ease-out",
                    locked
                      ? "cursor-not-allowed opacity-55"
                      : "hover:bg-muted-bg",
                    isActive && !locked && "border border-border bg-muted-bg",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {option.id}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {locked && (
                        <Badge variant="muted" className="gap-1 px-1.5">
                          <Lock className="h-2.5 w-2.5" aria-hidden />
                          Pro
                        </Badge>
                      )}
                      {isActive && !locked && (
                        <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold text-accent-strong">
                          Active
                        </span>
                      )}
                    </span>
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
      {!isPaid && (
        <p className="shrink-0 border-t border-border px-3 py-2 text-[10px] leading-relaxed text-muted">
          Free plan uses {DEFAULT_CHAT_MODEL}. Upgrade to Pro in Settings to
          unlock advanced models.
        </p>
      )}
    </div>
  );

  return createPortal(menu, document.body);
}
