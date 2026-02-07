import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { createTask, uploadFile, type CreateTaskBody } from "../api/client";
import { WalletGuard } from "../components/WalletGuard";

const TASK_TYPES = [
  { value: 0, label: "Text" },
  { value: 1, label: "Image" },
  { value: 2, label: "Audio" },
];

const CONTENT_TYPES: Record<number, string> = {
  0: "text",
  1: "image",
  2: "audio",
};

function generateDatasetRef(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateItemId(index: number): string {
  const arr = new Uint8Array(32);
  new DataView(arr.buffer).setUint32(28, index, false);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type ItemRow = { content: string; content_type: string };

export function CreateTask() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [taskType, setTaskType] = useState(0);
  const [description, setDescription] = useState("");
  const [rubrics, setRubrics] = useState("");
  const [rubricType, setRubricType] = useState<"single_choice" | "free_text">("free_text");
  const [items, setItems] = useState<ItemRow[]>([{ content: "", content_type: "text" }]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => setItems((prev) => [...prev, { content: "", content_type: CONTENT_TYPES[taskType] }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ItemRow, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!publicKey) return;
    const valid = items.filter((r) => r.content.trim() !== "");
    if (valid.length === 0) {
      setError("Add at least one item with content.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const datasetRefHex = generateDatasetRef();
      const body: CreateTaskBody = {
        owner_pubkey: publicKey.toBase58(),
        dataset_ref_hex: datasetRefHex,
        task_type: taskType,
        description: description.trim() || null,
        rubrics: rubrics.trim() || null,
        rubric_type: rubricType,
        items: valid.map((r, i) => ({
          item_id_hex: generateItemId(i),
          content: r.content.trim(),
          content_type: r.content_type,
        })),
      };
      const { id } = await createTask(body);
      navigate(`/task/${id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <WalletGuard>
        <div />
      </WalletGuard>
    );
  }

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
        <h1 className="text-2xl font-bold text-white tracking-tight">Create task</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface-800 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Task description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should labelers do?"
            rows={3}
            className="w-full bg-surface-700 border border-border rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-accent font-quantico"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Rubric type</label>
          <select
            value={rubricType}
            onChange={(e) => setRubricType(e.target.value as "single_choice" | "free_text")}
            className="bg-surface-700 border border-border rounded px-3 py-2 text-white font-quantico"
          >
            <option value="free_text">Free text (any label)</option>
            <option value="single_choice">Single choice (from rubrics below)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Rubrics</label>
          <textarea
            value={rubrics}
            onChange={(e) => setRubrics(e.target.value)}
            placeholder={rubricType === "single_choice" ? "One option per line, e.g. Positive\nNegative\nNeutral" : "Optional: suggested labels (one per line)"}
            rows={3}
            className="w-full bg-surface-700 border border-border rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-accent font-quantico"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Task type</label>
          <select
            value={taskType}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTaskType(v);
              setItems((prev) => prev.map((r) => ({ ...r, content_type: CONTENT_TYPES[v] })));
            }}
            className="bg-surface-700 border border-border rounded px-3 py-2 text-white font-quantico"
          >
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-400">Items</label>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-accent hover:underline"
            >
              + Add item
            </button>
          </div>
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2 items-start flex-wrap">
                <input
                  type="text"
                  placeholder={taskType === 0 ? "Text content" : taskType === 1 ? "Image URL or upload below" : "Audio URL or upload below"}
                  value={item.content}
                  onChange={(e) => updateItem(i, "content", e.target.value)}
                  className="flex-1 min-w-[200px] bg-surface-700 border border-border rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-accent font-quantico"
                />
                {(taskType === 1 || taskType === 2) && (
                  <label className="px-3 py-2 bg-surface-600 border border-border rounded text-sm text-zinc-300 cursor-pointer hover:bg-surface-500">
                    Upload
                    <input
                      type="file"
                      accept={taskType === 1 ? "image/*" : "audio/*"}
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const base64 = await new Promise<string>((res, rej) => {
                            const r = new FileReader();
                            r.onload = () => res((r.result as string).split(",")[1] || "");
                            r.onerror = rej;
                            r.readAsDataURL(file);
                          });
                          const url = await uploadFile(base64, file.name);
                          updateItem(i, "content", url);
                        } catch (err: any) {
                          setError(err.message || "Upload failed");
                        } finally {
                          setUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-zinc-500 hover:text-red-400 px-2 py-1"
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-accent text-surface-900 font-bold rounded hover:bg-accent-dim disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creating…" : "Create task"}
          </button>
        </div>
      </div>
    </div>
  );
}
