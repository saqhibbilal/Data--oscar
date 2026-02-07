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

## Phase 3 – Oracle (submit to chain)

The oracle reads pending aggregated results from the DB and submits them to the Solana program.

**1. One-time setup**

- Generate an oracle keypair (do not use your main wallet):
  ```bash
  solana-keygen new -o oracle-keypair.json
  ```
- On-chain: call **init_config** with this key’s pubkey (so only this key can submit). Do this once after deploy.
- Put `oracle-keypair.json` in the `backend/` folder (or set `ORACLE_KEYPAIR_PATH` to its path).
- Ensure `backend/idl/anchor_data.json` exists (copy from `anchor_data/target/idl/anchor_data.json` after `anchor build`).

**2. Run**

From `backend/`:

```bash
npm run aggregate   # if you have new submissions
npm run oracle      # submit pending results to devnet
```

Optional env: `SOLANA_RPC_URL` (default devnet), `ORACLE_KEYPAIR_PATH` (default `./oracle-keypair.json`).

The oracle only submits rows with `submitted_to_chain = 0` and sets them to `1` after a successful tx. Tasks must exist on-chain (same `owner_pubkey` and `dataset_ref_hex` as in the backend).
