import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, type DashboardStats } from "../../api/client";

const PROJECT_BLURB =
  "A mini decentralized data labeling system on Solana. Creators define text or image tasks; labelers submit labels off-chain. An oracle aggregates results and publishes verified outcomes on-chain. Reputation is tracked for labelers.";

export function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-surface-800 p-4">
        <p className="text-sm text-zinc-300 leading-relaxed">{PROJECT_BLURB}</p>
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
      {!loading && stats && (
        <>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Task owners</h2>
            <div className="rounded-lg border border-border bg-surface-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-zinc-400">
                    <th className="px-4 py-3">Owner (wallet)</th>
                    <th className="px-4 py-3">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.task_owners.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-zinc-500">
                        No task owners yet.
                      </td>
                    </tr>
                  ) : (
                    stats.task_owners.map((o) => (
                      <tr key={o.owner_pubkey} className="border-b border-border">
                        <td className="px-4 py-3 font-mono text-zinc-300 truncate max-w-[200px]">
                          {o.owner_pubkey}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{o.task_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Tasks (on-chain vs pending)</h2>
            <div className="rounded-lg border border-border bg-surface-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-zinc-400">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Submissions</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-zinc-500">
                        No tasks yet.
                      </td>
                    </tr>
                  ) : (
                    stats.tasks.map((t) => (
                      <tr key={t.id} className="border-b border-border">
                        <td className="px-4 py-3 text-white font-medium">{t.id}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {t.task_type === 0 ? "Text" : "Image"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              t.registered_on_chain
                                ? "text-accent"
                                : "text-zinc-500"
                            }
                          >
                            {t.registered_on_chain ? "On-chain" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{t.item_count}</td>
                        <td className="px-4 py-3 text-zinc-400">{t.submission_count}</td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/task/${t.id}`}
                            className="text-accent hover:underline text-xs"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Labelers (reputation index)</h2>
            <div className="rounded-lg border border-border bg-surface-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-zinc-400">
                    <th className="px-4 py-3">Labeler (wallet)</th>
                    <th className="px-4 py-3">Tasks contributed</th>
                    <th className="px-4 py-3">Total submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.labelers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-zinc-500">
                        No labelers yet.
                      </td>
                    </tr>
                  ) : (
                    stats.labelers.map((l) => (
                      <tr key={l.labeler_pubkey} className="border-b border-border">
                        <td className="px-4 py-3 font-mono text-zinc-300 truncate max-w-[200px]">
                          {l.labeler_pubkey}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{l.task_count}</td>
                        <td className="px-4 py-3 text-accent font-medium">
                          {l.submission_count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
