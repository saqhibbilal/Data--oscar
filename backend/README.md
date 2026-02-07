# Phase 2 – Backend (aggregation + SQLite)

Off-chain API for tasks, label submissions, and aggregated results. No frontend; use curl or Postman.

## Setup

```bash
cd backend
npm install
```

## Run

**Dev (TS):**
```bash
npm run dev
```

**Prod:**
```bash
npm run build
npm start
```

Server runs at `http://localhost:3000` (or `PORT` env).

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/tasks` | Create task. Body: `{ "owner_pubkey", "dataset_ref_hex", "task_type" (0=text, 1=image, 2=audio), "items"?: [{ "item_id_hex", "content?", "content_type?" }] }` |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/:id` | Get task and its items |
| POST | `/tasks/:id/submit` | Submit labels. Body: `{ "labeler_pubkey", "submissions": [{ "item_id_hex", "label_value" }] }` |
| GET | `/tasks/:id/aggregated` | Get aggregated results (for oracle) |

## Aggregation

Run after submissions exist:

```bash
npm run aggregate
```

- Groups submissions by `(task_id, item_id_hex)`
- Majority vote → `final_label_hex` (64 bytes hex), `confidence` (0–1000)
- Writes/updates `data/labels.sqlite` → `aggregated_results`

Phase 3 oracle will read `GET /tasks/:id/aggregated` (or DB directly) and push to the Solana program.
