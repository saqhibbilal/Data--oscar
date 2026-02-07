import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchLabelerRemaining, fetchLabelerActivity, type RemainingTask, type LabelerActivityItem } from "../../api/client";

const TASK_TYPE_LABELS: Record<number, string> = {
  0: "Text",
  1: "Image",
};

export function LabelerTab() {
  const { publicKey } = useWallet();
  const [remaining, setRemaining] = useState<RemainingTask[]>([]);
  const [completed, setCompleted] = useState<LabelerActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      return;
    }
    const pubkey = publicKey.toBase58();
    Promise.all([fetchLabelerRemaining(pubkey), fetchLabelerActivity(pubkey)])
      .then(([rem, act]) => {
        setRemaining(rem);
        setCompleted(act);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [publicKey]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Tasks to label (remaining)</h2>
        <p className="text-sm text-zinc-500 mb-3">Tasks where you have items left to label. Open one to complete and submit.</p>
        {loading && (
          <div className="rounded-lg border border-border bg-surface-800 p-8 text-center text-zinc-500">
            Loading…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && remaining.length === 0 && (
          <div className="rounded-lg border border-border bg-surface-800 p-6 text-center text-zinc-500">
            No tasks with items left for you to label.
          </div>
        )}
        {!loading && !error && remaining.length > 0 && (
          <ul className="space-y-3">
            {remaining.map((t) => (
              <li key={t.task_id}>
                <Link
                  to={`/task/${t.task_id}`}
                  className="block rounded-lg border border-border bg-surface-800 p-4 hover:border-border-bright hover:bg-surface-700 transition-colors"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <span className="font-medium text-white">Task #{t.task_id}</span>
                    <span className="text-xs text-zinc-500 bg-surface-600 px-2 py-0.5 rounded">
                      {TASK_TYPE_LABELS[t.task_type] ?? "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-accent mt-1">{t.items_left} items left to label</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Completed by you</h2>
        <p className="text-sm text-zinc-500 mb-3">Tasks you have submitted labels for.</p>
        {!loading && completed.length === 0 && (
          <div className="rounded-lg border border-border bg-surface-800 p-6 text-center text-zinc-500">
            None yet.
          </div>
        )}
        {!loading && completed.length > 0 && (
          <ul className="space-y-3">
            {completed.map((t) => (
              <li key={t.task_id}>
                <Link
                  to={`/task/${t.task_id}`}
                  className="block rounded-lg border border-border bg-surface-800 p-4 hover:border-border-bright hover:bg-surface-700 transition-colors"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <span className="font-medium text-white">Task #{t.task_id}</span>
                    <span className="text-xs text-zinc-500 bg-surface-600 px-2 py-0.5 rounded">
                      {TASK_TYPE_LABELS[t.task_type] ?? "Unknown"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    You submitted {t.submissions_count} label(s)
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
