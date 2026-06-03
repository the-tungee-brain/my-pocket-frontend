"use client";

import { Button } from "@/components/ui/Button";
import { appCalloutClass, appCalloutLabelClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type ResearchAiAnalyzePromptProps = {
  title?: string;
  description: string;
  buttonLabel: string;
  onAnalyze: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

export function ResearchAiAnalyzePrompt({
  title = "Ready to analyze",
  description,
  buttonLabel,
  onAnalyze,
  disabled = false,
  isLoading = false,
  className,
}: ResearchAiAnalyzePromptProps) {
  return (
    <div className={cn(appCalloutClass, className)}>
      <p className={appCalloutLabelClass}>{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          onClick={onAnalyze}
          disabled={disabled || isLoading}
          isLoading={isLoading}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
