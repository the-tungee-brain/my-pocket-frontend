"use client";

import { cn } from "@/lib/utils";

type DropdownProps = {
  open: boolean;
  options: string[];
  value: string;
  onChange: (id: string) => void;
  onClose: () => void;
};

export function Dropdown({
  open,
  options,
  value,
  onChange,
  onClose,
}: DropdownProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 min-w-55 border border-border bg-secondary p-1 text-xs shadow-2xl backdrop-blur">
      <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        Models
      </div>
      <div className="max-h-72 overflow-y-auto py-1" role="listbox">
        {options.map((option) => {
          const isActive = option === value;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => {
                onChange(option);
                onClose();
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-foreground transition-all duration-200 ease-out hover:bg-muted-bg",
                isActive && "border border-border bg-muted-bg",
              )}
            >
              <span className="truncate">{option}</span>
              {isActive && (
                <span className="ml-2 bg-accent-muted px-2 py-0.5 text-[10px] font-semibold text-accent-strong">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
