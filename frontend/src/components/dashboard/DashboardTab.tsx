import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, type DashboardStats } from "../../api/client";

const PROJECT_BLURB =
  "A mini decentralized data labeling system on Solana. Creators define text or image tasks; labelers submit labels off-chain. An oracle aggregates results and publishes verified outcomes on-chain. Reputation is tracked for labelers.";

const CHART_COLORS = {
  accent: "#22d3ee",
  accentDim: "#0891b2",
  muted: "#52525b",
  surface: "#27272a",
};

/** SVG donut: data = [{ name, value, color }], total = sum of values */
function DonutChart({
  data,
  size = 160,
  strokeWidth = 24,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  size?: number;
  strokeWidth?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let strokeOffset = 0;
  const segments = data.filter((d) => d.value > 0).map((d) => {
    const dash = circumference * (d.value / total);
    const gap = circumference - dash;
    const seg = { ...d, dash, gap, strokeOffset };
    strokeOffset += dash;
    return seg;
  });
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="overflow-visible">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.strokeOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {data.filter((d) => d.value > 0).map((d, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-zinc-400">{d.name}: {d.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Simple horizontal or vertical bar chart; data = [{ label, value }] */
function BarChartSimple({
  data,
  maxVal,
  color = CHART_COLORS.accent,
  vertical = false,
  barLabel,
}: {
  data: Array<{ label: string; value: number; sub?: string }>;
  maxVal?: number;
  color?: string;
  vertical?: boolean;
  barLabel?: (v: number, d: { label: string; value: number; sub?: string }) => string;
}) {
  const m = maxVal ?? Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return null;
  return (
    <div className={vertical ? "flex flex-col gap-2" : "flex flex-wrap gap-x-6 gap-y-4"}>
      {data.map((d, i) => (
        <div
          key={i}
          className={vertical ? "flex items-center gap-3" : "flex flex-col items-center gap-1 min-w-[60px]"}
        >
          {vertical && (
            <span
              className="text-xs text-zinc-400 font-mono w-14 truncate shrink-0"
              title={d.label}
            >
              {d.label}
            </span>
          )}
          <div className={vertical ? "flex-1 min-w-0 flex items-center gap-2" : "w-full flex flex-col items-center gap-1"}>
            <div
              className="rounded bg-surface-600 overflow-hidden flex items-center justify-end"
              style={{
                minWidth: vertical ? 40 : 4,
                width: vertical ? undefined : "100%",
                height: vertical ? 24 : Math.max(8, (d.value / m) * 120),
                minHeight: vertical ? 24 : 8,
              }}
            >
              <div
                className="rounded bg-opacity-90 transition-all"
                style={{
                  width: vertical ? `${Math.max(2, (d.value / m) * 100)}%` : "100%",
                  height: vertical ? "100%" : "100%",
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="text-xs text-zinc-300 font-quantico tabular-nums shrink-0">
              {barLabel ? barLabel(d.value, d) : d.value}
            </span>
          </div>
          {!vertical && (
            <span
              className="text-xs text-zinc-500 font-mono"
              title={d.sub ?? d.label}
            >
              {d.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-800 p-4 min-w-[120px]">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1 font-quantico">{value}</p>
      {sub !== undefined && (
        <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

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
          {/* KPI row */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Overview</h2>
            <div className="flex flex-wrap gap-4">
              <KpiCard label="Total tasks" value={stats.tasks.length} />
              <KpiCard
                label="On-chain"
                value={stats.tasks.filter((t) => t.registered_on_chain).length}
                sub="verified on Solana"
              />
              <KpiCard
                label="Pending"
                value={stats.tasks.filter((t) => !t.registered_on_chain).length}
                sub="awaiting registration"
              />
              <KpiCard
                label="Submissions"
                value={stats.tasks.reduce((s, t) => s + t.submission_count, 0)}
              />
              <KpiCard label="Labelers" value={stats.labelers.length} />
            </div>
          </section>

          {/* Analytics charts (SVG, no recharts) */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status: On-chain vs Pending */}
              <div className="rounded-lg border border-border bg-surface-800 p-4">
                <p className="text-sm font-medium text-zinc-400 mb-4">Task status</p>
                {stats.tasks.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-zinc-500 text-sm">
                    No tasks yet
                  </div>
                ) : (
                  <DonutChart
                    data={[
                      {
                        name: "On-chain",
                        value: stats.tasks.filter((t) => t.registered_on_chain).length,
                        color: CHART_COLORS.accent,
                      },
                      {
                        name: "Pending",
                        value: stats.tasks.filter((t) => !t.registered_on_chain).length,
                        color: CHART_COLORS.muted,
                      },
                    ]}
                    size={160}
                    strokeWidth={24}
                  />
                )}
              </div>

              {/* Task type: Text vs Image */}
              <div className="rounded-lg border border-border bg-surface-800 p-4">
                <p className="text-sm font-medium text-zinc-400 mb-4">Tasks by type</p>
                {stats.tasks.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-zinc-500 text-sm">
                    No tasks yet
                  </div>
                ) : (
                  <DonutChart
                    data={[
                      {
                        name: "Text",
                        value: stats.tasks.filter((t) => t.task_type === 0).length,
                        color: CHART_COLORS.accent,
                      },
                      {
                        name: "Image",
                        value: stats.tasks.filter((t) => t.task_type === 1).length,
                        color: CHART_COLORS.accentDim,
                      },
                    ]}
                    size={160}
                    strokeWidth={24}
                  />
                )}
              </div>

              {/* Submissions per task */}
              <div className="rounded-lg border border-border bg-surface-800 p-4 lg:col-span-2">
                <p className="text-sm font-medium text-zinc-400 mb-4">Submissions per task</p>
                {stats.tasks.length === 0 ? (
                  <div className="h-[120px] flex items-center justify-center text-zinc-500 text-sm">
                    No tasks yet
                  </div>
                ) : (
                  <div className="min-h-[120px]">
                    <BarChartSimple
                      data={stats.tasks.map((t) => ({
                        label: `#${t.id}`,
                        value: t.submission_count,
                        sub: `${t.item_count} items`,
                      }))}
                      color={CHART_COLORS.accent}
                      barLabel={(v, d) => (d.sub ? `${v} (${d.sub})` : String(v))}
                    />
                  </div>
                )}
              </div>

              {/* Labeler activity */}
              <div className="rounded-lg border border-border bg-surface-800 p-4 lg:col-span-2">
                <p className="text-sm font-medium text-zinc-400 mb-4">Labeler activity (submissions)</p>
                {stats.labelers.length === 0 ? (
                  <div className="h-[120px] flex items-center justify-center text-zinc-500 text-sm">
                    No labelers yet
                  </div>
                ) : (
                  <BarChartSimple
                    data={stats.labelers.slice(0, 10).map((l) => ({
                      label: `${l.labeler_pubkey.slice(0, 4)}…${l.labeler_pubkey.slice(-4)}`,
                      value: l.submission_count,
                      sub: `${l.task_count} tasks`,
                    }))}
                    color={CHART_COLORS.accentDim}
                    vertical
                    barLabel={(v, d) => (d.sub ? `${v} (${d.sub})` : String(v))}
                  />
                )}
              </div>
            </div>
          </section>

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
