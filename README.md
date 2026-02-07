# Decentralized data labeling (Solana)

Portfolio project: off-chain labeling + on-chain verification via an oracle. Phases: 1 Anchor program, 2 backend + SQLite, 3 oracle script, 4 React frontend, 5 polish + optional multimodal.

## Phase 1 – Anchor program

- **Workspace:** [anchor_data/](anchor_data/). Run `anchor` from inside **anchor_data/** (e.g. `cd anchor_data` then `anchor build` / `anchor deploy`).
- See [anchor_data/README.md](anchor_data/README.md).

## Phase 2 – Backend (Node + SQLite)

- **Folder:** [backend/](backend/) – Express API, SQLite (tasks, items, submissions, aggregated_results), aggregation script (majority vote).
- Run: `cd backend && npm install && npm run dev`. See [backend/README.md](backend/README.md).
## Phase 3 – Oracle

- **In backend:** Run `npm run oracle` (after `npm run aggregate`). Uses `backend/idl/anchor_data.json` and oracle keypair; submits pending aggregated results to the Solana program. See [backend/README.md](backend/README.md).
- **Prereqs:** Call **init_config** with the oracle pubkey once; put the oracle keypair in `backend/` (e.g. `oracle-keypair.json`). Copy IDL from `anchor_data/target/idl/` to `backend/idl/` after each `anchor build`.
## Phase 4 – Frontend

- **Folder:** [frontend/](frontend/) – React + Vite + TypeScript, Phantom wallet, dark sharp UI, Quantico font.
- Run: `cd frontend && npm install && npm run dev`. Set `VITE_API_URL=http://localhost:3000` (or in `.env`) so the app talks to the backend. See [frontend/README.md](frontend/README.md).
