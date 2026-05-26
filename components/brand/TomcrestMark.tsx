import { cn } from "@/lib/utils";
import type { LogoVariant } from "@/lib/brand";

type TomcrestMarkProps = {
  variant?: LogoVariant;
  className?: string;
};

export function TomcrestMark({
  variant = "crest",
  className,
}: TomcrestMarkProps) {
  if (variant === "monogram") {
    return <MonogramMark className={className} />;
  }

  if (variant === "wordmark") {
    return <WordmarkGlyph className={className} />;
  }

  return <CrestMark className={className} />;
}

function CrestMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path
        d="M3.5 18.5L8 13.5L11.5 16L15.5 10L20.5 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 21C6.8 17.2 9.4 15.8 11.5 15.8C13.6 15.8 16.2 17.2 19.5 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <circle cx="15.5" cy="10" r="1.75" fill="currentColor" />
    </svg>
  );
}

function MonogramMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path
        d="M8.5 5V19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M5.5 5H17.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M14.5 5L18.5 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WordmarkGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 16V8.5M8 8.5H11.5M8 8.5H5.5M14.5 16V11.5C14.5 10.12 15.62 9 17 9C18.38 9 19.5 10.12 19.5 11.5V16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
