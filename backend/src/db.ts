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
      description TEXT,
      rubrics TEXT,
      rubric_type TEXT,
      registered_on_chain INTEGER NOT NULL DEFAULT 0,
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
      representative_labeler_pubkey TEXT,
      aggregated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      submitted_to_chain INTEGER NOT NULL DEFAULT 0,
      UNIQUE(task_id, item_id_hex)
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_task_item ON submissions(task_id, item_id_hex);
    CREATE INDEX IF NOT EXISTS idx_aggregated_task ON aggregated_results(task_id);
  `);

  // Migration: add new columns if table existed from before
  const tableInfo = db.prepare("PRAGMA table_info(aggregated_results)").all() as Array<{ name: string }>;
  const names = new Set(tableInfo.map((r) => r.name));
  if (!names.has("representative_labeler_pubkey")) {
    db.exec("ALTER TABLE aggregated_results ADD COLUMN representative_labeler_pubkey TEXT");
  }
  if (!names.has("submitted_to_chain")) {
    db.exec("ALTER TABLE aggregated_results ADD COLUMN submitted_to_chain INTEGER NOT NULL DEFAULT 0");
  }

  const taskInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  const taskNames = new Set(taskInfo.map((r) => r.name));
  if (!taskNames.has("description")) db.exec("ALTER TABLE tasks ADD COLUMN description TEXT");
  if (!taskNames.has("rubrics")) db.exec("ALTER TABLE tasks ADD COLUMN rubrics TEXT");
  if (!taskNames.has("rubric_type")) db.exec("ALTER TABLE tasks ADD COLUMN rubric_type TEXT");
  if (!taskNames.has("registered_on_chain")) {
    db.exec("ALTER TABLE tasks ADD COLUMN registered_on_chain INTEGER NOT NULL DEFAULT 0");
  }

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
  representative_labeler_pubkey: string | null;
  aggregated_at: number;
  submitted_to_chain: number;
};
