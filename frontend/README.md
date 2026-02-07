# Phase 4 – Frontend

React + Vite + TypeScript. Phantom wallet, dark sharp theme, Quantico font.

## Setup

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:5173. Point the app at your backend with `VITE_API_URL` (default `http://localhost:3000`). Create a `.env` in `frontend/` with:

```
VITE_API_URL=http://localhost:3000
```

## Flow

1. Connect Phantom (top right).
2. Tasks list loads from the backend; click a task.
3. Label each item and submit (uses your wallet as `labeler_pubkey`).
4. Verified results (after aggregation + oracle) appear at the bottom.

Copy `anchor_data/target/idl/anchor_data.json` to `frontend/src/idl/anchor_data.json` after program changes if you add on-chain reads later.
