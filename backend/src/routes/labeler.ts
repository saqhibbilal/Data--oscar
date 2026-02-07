import { Router, Request, Response } from "express";
import { getDb } from "../db";

export const labelerRouter = Router();

labelerRouter.get("/:pubkey/activity", (req: Request, res: Response) => {
  try {
    const pubkey = req.params.pubkey;
    if (!pubkey) {
      res.status(400).json({ error: "pubkey required" });
      return;
    }
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT t.id AS task_id, t.owner_pubkey, t.dataset_ref_hex, t.task_type, COUNT(s.id) AS submissions_count
         FROM submissions s
         JOIN tasks t ON s.task_id = t.id
         WHERE s.labeler_pubkey = ?
         GROUP BY t.id, t.owner_pubkey, t.dataset_ref_hex, t.task_type
         ORDER BY MAX(s.submitted_at) DESC`
      )
      .all(pubkey);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

labelerRouter.get("/:pubkey/remaining", (req: Request, res: Response) => {
  try {
    const pubkey = req.params.pubkey;
    if (!pubkey) {
      res.status(400).json({ error: "pubkey required" });
      return;
    }
    const db = getDb();
    const tasks = db.prepare("SELECT id, owner_pubkey, dataset_ref_hex, task_type, registered_on_chain FROM tasks ORDER BY created_at DESC").all() as Array<{
      id: number;
      owner_pubkey: string;
      dataset_ref_hex: string;
      task_type: number;
      registered_on_chain: number;
    }>;
    const result: Array<{
      task_id: number;
      owner_pubkey: string;
      dataset_ref_hex: string;
      task_type: number;
      registered_on_chain: number;
      item_count: number;
      submitted_count: number;
      items_left: number;
    }> = [];
    for (const t of tasks) {
      const itemCount = (db.prepare("SELECT COUNT(*) AS c FROM items WHERE task_id = ?").get(t.id) as { c: number }).c;
      const submittedCount = (db.prepare("SELECT COUNT(DISTINCT item_id_hex) AS c FROM submissions WHERE task_id = ? AND labeler_pubkey = ?").get(t.id, pubkey) as { c: number } | undefined)?.c ?? 0;
      const itemsLeft = itemCount - submittedCount;
      if (itemsLeft > 0) {
        result.push({
          task_id: t.id,
          owner_pubkey: t.owner_pubkey,
          dataset_ref_hex: t.dataset_ref_hex,
          task_type: t.task_type,
          registered_on_chain: t.registered_on_chain,
          item_count: itemCount,
          submitted_count: submittedCount,
          items_left: itemsLeft,
        });
      }
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
