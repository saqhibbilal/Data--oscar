# Decentralized data labeling (Solana)

Portfolio project: off-chain labeling + on-chain verification via an oracle. Phases: 1 Anchor program, 2 backend + SQLite, 3 oracle script, 4 React frontend, 5 polish + optional multimodal.

## Phase 1 – Anchor program

- **Workspace:** [anchor_data/](anchor_data/). Run `anchor` from inside **anchor_data/** (e.g. `cd anchor_data` then `anchor build` / `anchor deploy`).
- See [anchor_data/README.md](anchor_data/README.md).

## Phase 2 – Backend (Node + SQLite)

- **Folder:** [backend/](backend/) – Express API, SQLite (tasks, items, submissions, aggregated_results), aggregation script (majority vote).
- Run: `cd backend && npm install && npm run dev`. See [backend/README.md](backend/README.md).
- Next: Phase 3 adds the oracle script that reads aggregated data and submits to the chain.
