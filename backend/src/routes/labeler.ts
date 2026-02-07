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
