"use client";

type Option = {
  id: string;
  label: string;
};

type DropdownProps = {
  open: boolean;
  options: Option[];
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
    <div className="absolute bottom-full right-0 mb-2 min-w-55 rounded-2xl border border-border bg-secondary p-1 text-xs shadow-2xl backdrop-blur">
      <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        Models
      </div>
      <div className="max-h-72 overflow-y-auto py-1">
        {options.map((option) => {
          const isActive = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                onClose();
              }}
              className={[
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left",
                "hover:bg-neutral-800/80 text-foreground",
                "transition-all duration-200 ease-out",
                isActive ? "bg-neutral-800/80 border border-border" : "",
              ].join(" ")}
            >
              <span className="truncate">{option.label}</span>
              {isActive && (
                <span className="ml-2 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
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
