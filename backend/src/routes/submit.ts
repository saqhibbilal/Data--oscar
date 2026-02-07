import { Router, Request, Response } from "express";
import { getDb } from "../db";

export const submitRouter = Router();

submitRouter.post("/tasks/:id/submit", (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      res.status(400).json({ error: "Invalid task id" });
      return;
    }
    const { labeler_pubkey, submissions: subs } = req.body as {
      labeler_pubkey: string;
      submissions: Array<{ item_id_hex: string; label_value: string }>;
    };
    if (!labeler_pubkey) {
      res.status(400).json({ error: "labeler_pubkey required" });
      return;
    }
    const submissions = Array.isArray(subs) ? subs : [req.body as { item_id_hex: string; label_value: string }];
    if (submissions.length === 0 || !submissions[0].item_id_hex) {
      res.status(400).json({ error: "At least one submission with item_id_hex and label_value required" });
      return;
    }

    const db = getDb();
    const task = db.prepare("SELECT id FROM tasks WHERE id = ?").get(taskId);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const insert = db.prepare(
      "INSERT INTO submissions (task_id, item_id_hex, labeler_pubkey, label_value) VALUES (?, ?, ?, ?)"
    );
    const run = db.transaction(() => {
      for (const s of submissions) {
        insert.run(taskId, s.item_id_hex, labeler_pubkey, s.label_value ?? "");
      }
    });
    run();

    res.status(201).json({ ok: true, count: submissions.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
