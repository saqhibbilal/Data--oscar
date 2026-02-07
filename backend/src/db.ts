import Database from "better-sqlite3";
import path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "labels.sqlite");

export function getDb(): Database.Database {
  const fs = require("fs");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_pubkey TEXT NOT NULL,
      dataset_ref_hex TEXT NOT NULL,
      task_type INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      item_id_hex TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'text',
      content TEXT,
      UNIQUE(task_id, item_id_hex)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      item_id_hex TEXT NOT NULL,
      labeler_pubkey TEXT NOT NULL,
      label_value TEXT NOT NULL,
      submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS aggregated_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      item_id_hex TEXT NOT NULL,
      final_label_hex TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      aggregated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(task_id, item_id_hex)
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_task_item ON submissions(task_id, item_id_hex);
    CREATE INDEX IF NOT EXISTS idx_aggregated_task ON aggregated_results(task_id);
  `);

  return db;
}

export type TaskRow = {
  id: number;
  owner_pubkey: string;
  dataset_ref_hex: string;
  task_type: number;
  created_at: number;
};

export type ItemRow = {
  id: number;
  task_id: number;
  item_id_hex: string;
  content_type: string;
  content: string | null;
};

export type SubmissionRow = {
  id: number;
  task_id: number;
  item_id_hex: string;
  labeler_pubkey: string;
  label_value: string;
  submitted_at: number;
};

export type AggregatedRow = {
  id: number;
  task_id: number;
  item_id_hex: string;
  final_label_hex: string;
  confidence: number;
  aggregated_at: number;
};
