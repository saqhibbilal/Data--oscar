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
    INSERT INTO aggregated_results (task_id, item_id_hex, final_label_hex, confidence, representative_labeler_pubkey, aggregated_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(task_id, item_id_hex) DO UPDATE SET
      final_label_hex = excluded.final_label_hex,
      confidence = excluded.confidence,
      representative_labeler_pubkey = excluded.representative_labeler_pubkey,
      aggregated_at = unixepoch()
  `);

  for (const { id: taskId } of tasks) {
    const rows = db
      .prepare(
        "SELECT item_id_hex, label_value, labeler_pubkey FROM submissions WHERE task_id = ?"
      )
      .all(taskId) as Array<{ item_id_hex: string; label_value: string; labeler_pubkey: string }>;

    const byItem = new Map<string, Array<{ label: string; labeler: string }>>();
    for (const row of rows) {
      const list = byItem.get(row.item_id_hex) ?? [];
      list.push({ label: row.label_value, labeler: row.labeler_pubkey });
      byItem.set(row.item_id_hex, list);
    }

    const run = db.transaction(() => {
      for (const [itemIdHex, entries] of byItem) {
        const counts = new Map<string, { count: number; firstLabeler: string }>();
        for (const { label, labeler } of entries) {
          const cur = counts.get(label);
          if (!cur) {
            counts.set(label, { count: 1, firstLabeler: labeler });
          } else {
            cur.count += 1;
          }
        }
        let bestLabel = "";
        let bestCount = 0;
        let bestLabeler = "";
        for (const [label, { count, firstLabeler }] of counts) {
          if (count > bestCount) {
            bestCount = count;
            bestLabel = label;
            bestLabeler = firstLabeler;
          }
        }
        const confidence = entries.length > 0
          ? Math.floor((bestCount / entries.length) * 1000)
          : 0;
        const finalLabelHex = padOrTruncateHex(
          Buffer.from(bestLabel, "utf8").toString("hex")
        );
        upsert.run(taskId, itemIdHex, finalLabelHex, confidence, bestLabeler || null);
      }
    });
    run();
  }
  console.log("Aggregation done.");
}

runAggregation();
