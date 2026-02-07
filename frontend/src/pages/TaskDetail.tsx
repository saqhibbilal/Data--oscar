import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { fetchTask, submitLabels, fetchAggregated, type Task } from "../api/client";
import { WalletGuard } from "../components/WalletGuard";
import { registerTaskOnChain } from "../solana/initTask";

type AggregatedRow = {
  item_id_hex: string;
  final_label_hex: string;
  confidence: number;
};

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  const [task, setTask] = useState<Task | null>(null);
  const [aggregated, setAggregated] = useState<AggregatedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchTask(id), fetchAggregated(id)])
      .then(([t, agg]) => {
        setTask(t);
        setAggregated(agg as AggregatedRow[]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!task || !publicKey) return;
    const submissions = Object.entries(labels)
      .filter(([, v]) => v.trim() !== "")
      .map(([itemIdHex, label_value]) => ({ item_id_hex: itemIdHex, label_value }));
    if (submissions.length === 0) {
      setError("Add at least one label.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitLabels(task.id, publicKey.toBase58(), submissions);
      setLabels({});
      navigate("/");
    } catch (e: any) {
      setError(e.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterOnChain = async () => {
    if (!task || !publicKey) return;
    if (task.owner_pubkey !== publicKey.toBase58()) {
      setError("Only the task owner can register this task on Solana.");
      return;
    }
    setRegistering(true);
    setError(null);
    try {
      await registerTaskOnChain(connection, wallet, task);
      setRegistered(true);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("already in use") || msg.includes("0x0")) {
        setRegistered(true);
      } else {
        setError(msg);
      }
    } finally {
      setRegistering(false);
    }
  };

  const isOwner = task && publicKey && task.owner_pubkey === publicKey.toBase58();

  if (!connected) {
    return (
      <WalletGuard>
        <div />
      </WalletGuard>
    );
  }

  if (loading || !task) {
    return (
      <div className="rounded-lg border border-border bg-surface-800 p-8 text-center text-zinc-500">
        {loading ? "Loading…" : "Task not found."}
      </div>
    );
  }

  const items = task.items || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">Task #{task.id}</h1>
        <span className="text-xs text-zinc-500 bg-surface-600 px-2 py-1 rounded">
          {task.task_type === 0 ? "Text" : task.task_type === 1 ? "Image" : "Audio"}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isOwner && (
        <div className="rounded-lg border border-border bg-surface-800 p-4">
          <p className="text-sm text-zinc-400 mb-2">
            Register this task on Solana so the oracle can submit verified results. (One-time, as task owner.)
          </p>
          <button
            type="button"
            onClick={handleRegisterOnChain}
            disabled={registering || registered}
            className="px-4 py-2 bg-surface-600 border border-border-bright text-white font-medium rounded hover:bg-surface-500 disabled:opacity-50 transition-colors"
          >
            {registered ? "Registered on Solana" : registering ? "Registering…" : "Register task on Solana"}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-800 p-6 text-zinc-500">
          No items in this task.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface-800 overflow-hidden">
            <div className="border-b border-border px-4 py-3 text-sm font-medium text-zinc-400">
              Label each item
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-4">
                  <div className="text-xs text-zinc-500 font-mono mb-2">
                    {item.item_id_hex.slice(0, 16)}…
                  </div>
                  <div className="text-sm text-zinc-300 mb-2">
                    <ItemContent content={item.content} contentType={item.content_type} />
                  </div>
                  <input
                    type="text"
                    placeholder="Your label"
                    value={labels[item.item_id_hex] ?? ""}
                    onChange={(e) =>
                      setLabels((prev) => ({ ...prev, [item.item_id_hex]: e.target.value }))
                    }
                    className="w-full max-w-xs bg-surface-700 border border-border rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-quantico"
                  />
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-accent text-surface-900 font-bold rounded hover:bg-accent-dim disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting…" : "Submit labels"}
              </button>
            </div>
          </div>
        </div>
      )}

      {aggregated.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-800 overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-sm font-medium text-zinc-400">
            Verified results (on-chain)
          </div>
          <ul className="divide-y divide-border">
            {aggregated.map((row, i) => (
              <li key={i} className="px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-mono text-zinc-500 truncate max-w-[200px]">
                  {row.item_id_hex.slice(0, 12)}…
                </span>
                <span className="text-accent font-medium">
                  {row.confidence / 10}% · {hexToShortLabel(row.final_label_hex)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ItemContent({
  content,
  contentType,
}: {
  content: string | null;
  contentType: string;
}) {
  if (!content?.trim()) return <span>—</span>;
  const type = (contentType || "text").toLowerCase();
  if (type === "image") {
    return (
      <img
        src={content}
        alt="Item"
        className="max-w-full max-h-48 rounded border border-border object-contain"
      />
    );
  }
  if (type === "audio") {
    return (
      <audio controls className="w-full max-w-md" src={content}>
        Your browser does not support audio.
      </audio>
    );
  }
  return <span>{content}</span>;
}

function hexToShortLabel(hex: string): string {
  try {
    const bytes = hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
    const str = new TextDecoder().decode(new Uint8Array(bytes));
    return str.replace(/\0/g, "").trim() || "—";
  } catch {
    return "—";
  }
}
