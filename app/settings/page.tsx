import { Suspense } from "react";
import { SettingsPageContent } from "@/components/SettingsPageContent";
import { pageShellClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className={cn(pageShellClass, "py-8 text-sm text-muted")}>
          Loading settings…
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
