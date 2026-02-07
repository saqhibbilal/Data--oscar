import { Router, Request, Response } from "express";
import { getDb } from "../db";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const tasks = db
      .prepare(
        `SELECT t.id, t.owner_pubkey, t.task_type, t.registered_on_chain, t.created_at,
                (SELECT COUNT(*) FROM items i WHERE i.task_id = t.id) AS item_count,
                (SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id) AS submission_count
         FROM tasks t
         ORDER BY t.created_at DESC`
      )
      .all() as Array<{
      id: number;
      owner_pubkey: string;
      task_type: number;
      registered_on_chain: number;
      created_at: number;
      item_count: number;
      submission_count: number;
    }>;

    const ownerRows = db
      .prepare(
        "SELECT owner_pubkey, COUNT(*) AS task_count FROM tasks GROUP BY owner_pubkey ORDER BY task_count DESC"
      )
      .all() as Array<{ owner_pubkey: string; task_count: number }>;

    const labelerRows = db
      .prepare(
        `SELECT labeler_pubkey, COUNT(DISTINCT task_id) AS task_count, COUNT(*) AS submission_count
         FROM submissions GROUP BY labeler_pubkey ORDER BY submission_count DESC`
      )
      .all() as Array<{ labeler_pubkey: string; task_count: number; submission_count: number }>;

    res.json({
      task_owners: ownerRows,
      tasks,
      labelers: labelerRows,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
