const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type Task = {
  id: number;
  owner_pubkey: string;
  dataset_ref_hex: string;
  task_type: number;
  description?: string | null;
  rubrics?: string | null;
  rubric_type?: string | null;
  created_at: number;
  items?: Array<{
    id: number;
    task_id: number;
    item_id_hex: string;
    content_type: string;
    content: string | null;
  }>;
};

export type CreateTaskBody = {
  owner_pubkey: string;
  dataset_ref_hex: string;
  task_type: number;
  description?: string | null;
  rubrics?: string | null;
  rubric_type?: string | null;
  items?: Array<{ item_id_hex: string; content?: string | null; content_type?: string }>;
};

export type MySubmission = { item_id_hex: string; label_value: string };

export async function fetchMySubmissions(
  taskId: string,
  labelerPubkey: string
): Promise<MySubmission[]> {
  const res = await fetch(
    `${API_BASE}/tasks/${taskId}/my-submissions?labeler=${encodeURIComponent(labelerPubkey)}`
  );
  if (!res.ok) throw new Error("Failed to fetch my submissions");
  return res.json();
}

export async function uploadFile(base64: string, filename: string): Promise<string> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64, filename }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  const { url } = await res.json();
  return `${API_BASE}${url}`;
}

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

export async function createTask(body: CreateTaskBody): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create task");
  }
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

export type LabelerActivityItem = {
  task_id: number;
  owner_pubkey: string;
  dataset_ref_hex: string;
  task_type: number;
  submissions_count: number;
};

export async function fetchLabelerActivity(pubkey: string): Promise<LabelerActivityItem[]> {
  const res = await fetch(`${API_BASE}/labeler/${encodeURIComponent(pubkey)}/activity`);
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}
