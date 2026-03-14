import { SchwabConnectCard } from "@/components/SchwabConnectCard";
import { AccountPositionList } from "./AccountPositionList";

export default function HomePage() {
  return (
    <main className="min-h-screen text-foreground flex flex-col items-stretch">
      <SchwabConnectCard />
      <AccountPositionList />
    </main>
  );
}
