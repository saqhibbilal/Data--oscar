import { Router, Request, Response } from "express";
import { getDb } from "../db";

export const tasksRouter = Router();
const TASK_TYPES = { text_classification: 0, image: 1, audio: 2 } as const;

tasksRouter.post("/", (req: Request, res: Response) => {
  try {
    const { owner_pubkey, dataset_ref_hex, task_type, description, rubrics, rubric_type, items } = req.body as {
      owner_pubkey: string;
      dataset_ref_hex: string;
      task_type: keyof typeof TASK_TYPES | number;
      description?: string;
      rubrics?: string;
      rubric_type?: string;
      items?: Array<{ item_id_hex: string; content?: string; content_type?: string }>;
    };
    if (!owner_pubkey || !dataset_ref_hex) {
      res.status(400).json({ error: "owner_pubkey and dataset_ref_hex required" });
      return;
    }
    const typeNum = typeof task_type === "string" ? TASK_TYPES[task_type] ?? 0 : Number(task_type);
    const db = getDb();
    const insert = db.prepare(
      "INSERT INTO tasks (owner_pubkey, dataset_ref_hex, task_type, description, rubrics, rubric_type) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const result = insert.run(
      owner_pubkey,
      dataset_ref_hex,
      typeNum,
      description ?? null,
      rubrics ?? null,
      rubric_type ?? null
    );
    const taskId = result.lastInsertRowid as number;

    if (items && Array.isArray(items) && items.length > 0) {
      const insItem = db.prepare(
        "INSERT INTO items (task_id, item_id_hex, content_type, content) VALUES (?, ?, ?, ?)"
      );
      for (const it of items) {
        const idHex = it.item_id_hex || Buffer.alloc(32).fill(0).toString("hex");
        insItem.run(taskId, idHex, it.content_type || "text", it.content ?? null);
      }
    }

    res.status(201).json({
      id: taskId,
      owner_pubkey,
      dataset_ref_hex,
      task_type: typeNum,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

tasksRouter.get("/", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

tasksRouter.get("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid task id" });
      return;
    }
    const db = getDb();
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const items = db.prepare("SELECT * FROM items WHERE task_id = ? ORDER BY id").all(id);
    res.json({ ...task, items });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

tasksRouter.get("/:id/aggregated", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid task id" });
      return;
    }
    const db = getDb();
    const rows = db.prepare("SELECT * FROM aggregated_results WHERE task_id = ?").all(id);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

tasksRouter.get("/:id/my-submissions", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const labeler = req.query.labeler as string;
    if (Number.isNaN(id) || !labeler) {
      res.status(400).json({ error: "task id and labeler query required" });
      return;
    }
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT item_id_hex, label_value FROM submissions WHERE task_id = ? AND labeler_pubkey = ?"
      )
      .all(id, labeler) as Array<{ item_id_hex: string; label_value: string }>;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

tasksRouter.patch("/:id/registered", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid task id" });
      return;
    }
    const db = getDb();
    db.prepare("UPDATE tasks SET registered_on_chain = 1 WHERE id = ?").run(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
