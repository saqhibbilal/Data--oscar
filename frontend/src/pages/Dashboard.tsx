import { Link, useSearchParams } from "react-router-dom";
import { WalletGuard } from "../components/WalletGuard";
import { CreatorTab } from "../components/dashboard/CreatorTab";
import { LabelerTab } from "../components/dashboard/LabelerTab";

type TabId = "creator" | "labeler";

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) || "labeler";
  const setTab = (t: TabId) => setSearchParams({ tab: t });

  return (
    <WalletGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Create tasks or label and earn reputation.</p>
        </div>

        <div className="flex gap-1 p-1 rounded-lg bg-surface-800 border border-border w-fit">
          <button
            type="button"
            onClick={() => setTab("creator")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "creator"
                ? "bg-surface-600 text-white border border-border-bright"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            I'm a creator
          </button>
          <button
            type="button"
            onClick={() => setTab("labeler")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "labeler"
                ? "bg-surface-600 text-white border border-border-bright"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            I'm a labeler
          </button>
        </div>

        {tab === "creator" && <CreatorTab />}
        {tab === "labeler" && <LabelerTab />}
      </div>
    </WalletGuard>
  );
}
