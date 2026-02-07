import { getDb } from "./db";

const LABEL_HEX_LEN = 128; // 64 bytes as hex

function padOrTruncateHex(s: string): string {
  const hex = s.replace(/[^0-9a-fA-F]/g, "").slice(0, LABEL_HEX_LEN);
  return hex.padEnd(LABEL_HEX_LEN, "0");
}

function runAggregation(): void {
  const db = getDb();
  const tasks = db.prepare("SELECT id FROM tasks").all() as Array<{ id: number }>;
  const upsert = db.prepare(`
    INSERT INTO aggregated_results (task_id, item_id_hex, final_label_hex, confidence, aggregated_at)
    VALUES (?, ?, ?, ?, unixepoch())
    ON CONFLICT(task_id, item_id_hex) DO UPDATE SET
      final_label_hex = excluded.final_label_hex,
      confidence = excluded.confidence,
      aggregated_at = unixepoch()
  `);

  for (const { id: taskId } of tasks) {
    const groups = db
      .prepare(
        "SELECT item_id_hex, label_value FROM submissions WHERE task_id = ?"
      )
      .all(taskId) as Array<{ item_id_hex: string; label_value: string }>;

    const byItem = new Map<string, string[]>();
    for (const row of groups) {
      const list = byItem.get(row.item_id_hex) ?? [];
      list.push(row.label_value);
      byItem.set(row.item_id_hex, list);
    }

    const run = db.transaction(() => {
      for (const [itemIdHex, labels] of byItem) {
        const counts = new Map<string, number>();
        for (const l of labels) {
          counts.set(l, (counts.get(l) ?? 0) + 1);
        }
        let bestLabel = "";
        let bestCount = 0;
        for (const [label, c] of counts) {
          if (c > bestCount) {
            bestCount = c;
            bestLabel = label;
          }
        }
        const confidence = labels.length > 0
          ? Math.floor((bestCount / labels.length) * 1000)
          : 0;
        const finalLabelHex = padOrTruncateHex(
          Buffer.from(bestLabel, "utf8").toString("hex")
        );
        upsert.run(taskId, itemIdHex, finalLabelHex, confidence);
      }
    });
    run();
  }
  console.log("Aggregation done.");
}

runAggregation();
