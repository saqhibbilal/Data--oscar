import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTasks, type Task } from "../api/client";
import { WalletGuard } from "../components/WalletGuard";

const TASK_TYPE_LABELS: Record<number, string> = {
  0: "Text",
  1: "Image",
  2: "Audio",
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WalletGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-zinc-500 text-sm mt-1">Pick a task to label items.</p>
        </div>

        {loading && (
          <div className="rounded-lg border border-border bg-surface-800 p-8 text-center text-zinc-500">
            Loading tasks…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && tasks.length === 0 && (
          <div className="rounded-lg border border-border bg-surface-800 p-8 text-center text-zinc-500">
            No tasks yet. Create one via the API or add seed data.
          </div>
        )}
        {!loading && !error && tasks.length > 0 && (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/task/${t.id}`}
                  className="block rounded-lg border border-border bg-surface-800 p-4 hover:border-border-bright hover:bg-surface-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-white">Task #{t.id}</span>
                    <span className="text-xs text-zinc-500 bg-surface-600 px-2 py-0.5 rounded">
                      {TASK_TYPE_LABELS[t.task_type] ?? "Unknown"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 font-mono truncate">
                    {t.owner_pubkey}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WalletGuard>
  );
}
