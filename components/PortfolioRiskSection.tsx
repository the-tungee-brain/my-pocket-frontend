"use client";

import type {
  AssignmentRiskSummary as AssignmentRiskSummaryData,
  CashSecuredPutSummary as CashSecuredPutSummaryData,
} from "@/app/types/schwab";
import { AssignmentRiskSummary } from "@/components/AssignmentRiskSummary";
import { CashSecuredPutSummary } from "@/components/CashSecuredPutSummary";
import { hasAssignmentRiskEntries } from "@/lib/assignmentRiskSummary";
import { cn } from "@/lib/utils";

type Props = {
  cashSecuredPutSummary?: CashSecuredPutSummaryData | null;
  assignmentRiskSummary?: AssignmentRiskSummaryData | null;
  cashBalance?: number | null;
  className?: string;
};

export function PortfolioRiskSection({
  cashSecuredPutSummary,
  assignmentRiskSummary,
  cashBalance,
  className,
}: Props) {
  const hasCsp =
    cashSecuredPutSummary && cashSecuredPutSummary.totalReservedCash > 0;
  const hasAssignment =
    assignmentRiskSummary &&
    hasAssignmentRiskEntries(assignmentRiskSummary);

  if (!hasCsp && !hasAssignment) return null;

  return (
    <section
      className={cn("mx-auto w-full max-w-3xl space-y-4", className)}
      aria-label="Options risk"
    >
      {hasCsp && (
        <CashSecuredPutSummary
          summary={cashSecuredPutSummary}
          cashBalance={cashBalance}
        />
      )}
      {hasAssignment && (
        <AssignmentRiskSummary summary={assignmentRiskSummary} />
      )}
    </section>
  );
}
