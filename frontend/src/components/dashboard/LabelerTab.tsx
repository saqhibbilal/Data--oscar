import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTasks, type Task } from "../../api/client";

const TASK_TYPE_LABELS: Record<number, string> = {
  0: "Text",
  1: "Image",
  2: "Audio",
};

export function LabelerTab() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Browse tasks</h2>
        <Link
          to="/activity"
          className="text-sm text-accent hover:underline"
        >
          My activity & reputation →
        </Link>
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
          No tasks available. Ask a creator to add one.
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
  );
}
