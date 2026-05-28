import { Suspense } from "react";
import { SettingsPageContent } from "@/components/SettingsPageContent";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-muted">
          Loading settings…
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
