import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { fetchLabelerActivity, type LabelerActivityItem } from "../api/client";
import { WalletGuard } from "../components/WalletGuard";
import { fetchReputationForTask } from "../solana/reputation";

const TASK_TYPE_LABELS: Record<number, string> = {
  0: "Text",
  1: "Image",
  2: "Audio",
};

type ActivityWithRep = LabelerActivityItem & { verified_count?: number; points?: number };

export function MyActivity() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [items, setItems] = useState<ActivityWithRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }
    const pubkey = publicKey.toBase58();
    fetchLabelerActivity(pubkey)
      .then(async (list) => {
        const withRep = await Promise.all(
          list.map(async (item) => {
            try {
              const rep = await fetchReputationForTask(
                item.owner_pubkey,
                item.dataset_ref_hex,
                pubkey,
                connection
              );
              return { ...item, verified_count: rep?.verified_count, points: rep?.points };
            } catch {
              return item;
            }
          })
        );
        setItems(withRep);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [connected, publicKey, connection]);

  if (!connected) {
    return (
      <WalletGuard>
        <div />
      </WalletGuard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">My activity & reputation</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-border bg-surface-800 p-8 text-center text-zinc-500">
          Loading…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-border bg-surface-800 p-8 text-center text-zinc-500">
          You haven't submitted labels to any task yet. Browse tasks and label to build reputation.
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.task_id}>
              <Link
                to={`/task/${item.task_id}`}
                className="block rounded-lg border border-border bg-surface-800 p-4 hover:border-border-bright hover:bg-surface-700 transition-colors"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <span className="font-medium text-white">Task #{item.task_id}</span>
                  <span className="text-xs text-zinc-500 bg-surface-600 px-2 py-0.5 rounded">
                    {TASK_TYPE_LABELS[item.task_type] ?? "Unknown"}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-zinc-400">
                  <span>Submissions: {item.submissions_count}</span>
                  {item.verified_count != null && (
                    <span className="text-accent">Verified on-chain: {item.verified_count}</span>
                  )}
                  {item.points != null && item.points > 0 && (
                    <span>Points: {item.points}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
