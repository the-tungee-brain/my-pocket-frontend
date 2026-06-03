"use client";

import { BriefcaseBusiness, TrendingDown, TrendingUp } from "lucide-react";
import {
  useBusinessDetails,
  type BusinessBlock,
} from "@/app/hooks/useBusinessDetails";
import { useSession } from "next-auth/react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { hasProFeature } from "@/lib/planFeatures";
import { cn } from "@/lib/utils";

type BusinessSectionProps = {
  symbol: string | null;
};

function SnapshotRow({ label, value }: { label: string; value: string }) {
  const display = value.trim() || "—";
  return (
    <div className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium leading-snug",
          display === "—" ? "text-muted" : "text-foreground",
        )}
      >
        {display}
      </p>
    </div>
  );
}

function BulletList({
  items,
  tone = "default",
}: {
  items: string[];
  tone?: "default" | "risk";
}) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "text-sm leading-snug before:mr-2 before:text-muted before:content-['•']",
            tone === "risk" ? "text-foreground" : "text-foreground",
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletColumn({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: typeof TrendingUp;
  tone: "positive" | "risk";
}) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "positive" ? "text-success" : "text-danger",
          )}
          aria-hidden
        />
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </h4>
      </div>
      <BulletList items={items} tone={tone === "risk" ? "risk" : "default"} />
    </div>
  );
}

function BusinessOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
      <Skeleton className="h-20 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  );
}

function BusinessIntelligenceContent({ business }: { business: BusinessBlock }) {
  const customersDisplay =
    business.primaryCustomers.length > 0
      ? business.primaryCustomers.join(", ")
      : "";

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Business snapshot
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <SnapshotRow label="Industry" value={business.industry} />
          <SnapshotRow label="Primary product" value={business.primaryProduct} />
          <SnapshotRow label="Customers" value={customersDisplay} />
          <SnapshotRow label="Revenue model" value={business.revenueModel} />
        </div>
      </section>

      {business.howTheyMakeMoney.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            How they make money
          </h3>
          <BulletList items={business.howTheyMakeMoney} />
        </section>
      ) : null}

      {business.revenueVisibility.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Revenue visibility
          </h3>
          <BulletList items={business.revenueVisibility} />
        </section>
      ) : null}

      {(business.advantages.length > 0 || business.challenges.length > 0) && (
        <section>
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Competitive position
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <BulletColumn
              title="Advantages"
              items={business.advantages}
              icon={TrendingUp}
              tone="positive"
            />
            <BulletColumn
              title="Challenges"
              items={business.challenges}
              icon={TrendingDown}
              tone="risk"
            />
          </div>
        </section>
      )}

      {(business.revenueDrivers.length > 0 ||
        business.constraints.length > 0) && (
        <section>
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Growth drivers vs constraints
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <BulletColumn
              title="Revenue drivers"
              items={business.revenueDrivers}
              icon={TrendingUp}
              tone="positive"
            />
            <BulletColumn
              title="Constraints"
              items={business.constraints}
              icon={TrendingDown}
              tone="risk"
            />
          </div>
        </section>
      )}

      {business.businessRisks.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Business risks
          </h3>
          <BulletList items={business.businessRisks} tone="risk" />
        </section>
      ) : null}

      {business.dependencies.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Key dependencies
          </h3>
          <BulletList items={business.dependencies} />
        </section>
      ) : null}
    </div>
  );
}

export function BusinessSection({ symbol }: BusinessSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { plan } = useAccountPlan(accessToken);
  const businessAllowed = hasProFeature(plan, "business");
  const { business, isLoading, error } = useBusinessDetails(symbol, {
    accessToken,
    enabled: businessAllowed,
  });

  return (
    <div className="app-stack">
      {error && businessAllowed && !business ? (
        <ErrorBanner message={error} />
      ) : null}

      <ResearchSectionCard
        title="Business"
        description={
          businessAllowed
            ? "Institutional business notes — mechanisms, limits, and asymmetry"
            : "Pro — structured business intelligence"
        }
        icon={BriefcaseBusiness}
      >
        <ProFeatureGate feature="business" allowed={businessAllowed}>
          {isLoading && !business ? (
            <BusinessOverviewSkeleton />
          ) : !business ? (
            <p className="text-sm text-muted">
              Business details are not available.
            </p>
          ) : (
            <BusinessIntelligenceContent business={business} />
          )}
        </ProFeatureGate>
      </ResearchSectionCard>
    </div>
  );
}
