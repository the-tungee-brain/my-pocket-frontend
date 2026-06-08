import { Suspense } from "react";
import { SettingsPageContent } from "@/components/SettingsPageContent";
import { Skeleton } from "@/components/ui/Skeleton";
import { pageShellClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className={cn(pageShellClass, "space-y-4 py-8")}>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
