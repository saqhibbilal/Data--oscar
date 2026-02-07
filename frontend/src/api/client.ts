const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type Task = {
  id: number;
  owner_pubkey: string;
  dataset_ref_hex: string;
  task_type: number;
  created_at: number;
  items?: Array<{
    id: number;
    task_id: number;
    item_id_hex: string;
    content_type: string;
    content: string | null;
  }>;
};

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`);
  if (!res.ok) throw new Error("Failed to fetch task");
  return res.json();
}

export async function submitLabels(
  taskId: number,
  labelerPubkey: string,
  submissions: Array<{ item_id_hex: string; label_value: string }>
): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labeler_pubkey: labelerPubkey, submissions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit labels");
  }
}

export async function fetchAggregated(taskId: string): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/aggregated`);
  if (!res.ok) throw new Error("Failed to fetch aggregated");
  return res.json();
}
