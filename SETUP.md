# Setup & Testing Guide

Step-by-step instructions to run the app from a fresh clone, get keys and devnet SOL, and test end-to-end.

---

## Prerequisites

- **Node.js** (v18+) and **npm**
- **Rust** and **Cargo** (for Anchor): https://rustup.rs
- **Solana CLI** and **Anchor CLI**  
  - Solana: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"` (or see [solana.com/docs](https://solana.com/docs))  
  - Anchor: `cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install latest && avm use latest`
- **Phantom** (or another Solana wallet) for the frontend: [phantom.app](https://phantom.app)

---

## 1. Clone and directories

```bash
git clone <your-repo-url>
cd anchor-data
```

Important folders:

| Path        | Purpose                          |
|------------|-----------------------------------|
| `anchor_data/` | Solana program (Anchor); run Anchor commands here |
| `backend/`     | Express API + SQLite; run Node scripts here       |
| `frontend/`    | React + Vite app; run frontend dev server here    |

---

## 2. Build and deploy the Solana program (devnet)

All Anchor commands must be run from **`anchor_data/`**.

```bash
cd anchor_data
anchor build
anchor deploy
```

- First time: Solana CLI may prompt to create a keypair at `~/.config/solana/id.json` (or set `SOLANA_CLI_CONFIG_PATH`).
- **Get devnet SOL** for the deployer wallet:
  ```bash
  solana config set --url devnet
  solana airdrop 2
  ```
  If airdrop is rate-limited, use a [devnet faucet](https://faucet.solana.com/) (select Devnet) or another wallet and transfer SOL.

After a successful deploy, copy the IDL into the backend:

```bash
# From repo root (anchor-data/)
cp anchor_data/target/idl/anchor_data.json backend/idl/
```

---

## 3. Backend setup

From the repo root:

```bash
cd backend
npm install
```

### Oracle keypair (required for init-config and oracle)

The backend uses a **separate keypair** as the oracle. Generate it in `backend/`:

```bash
cd backend
solana-keygen new -o oracle-keypair.json
```

- When prompted, you can leave the passphrase empty (dev only).
- **Do not commit** `oracle-keypair.json` (it’s in `.gitignore`).

### Get SOL for the oracle wallet

The oracle pays for on-chain transactions. Airdrop to the oracle pubkey:

```bash
solana airdrop 2 $(solana-keygen pubkey oracle-keypair.json)
```

Again, use a faucet if airdrop is rate-limited.

### One-time: init program config (oracle authority)

So the program accepts submissions from your oracle key:

```bash
cd backend
npm run init-config
```

You should see something like: `init_config done. Tx: <signature>`. If config is already set, the script may report that and exit.

### Start the backend

```bash
cd backend
npm run dev
```

Backend runs at **http://localhost:3000**. It creates `backend/data/labels.sqlite` and serves the API.

---

## 4. Frontend setup

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**.

Optional: create `frontend/.env` if you use a different API URL:

```env
VITE_API_URL=http://localhost:3000
```

---

## 5. Phantom (creator / labeler wallets)

- Install [Phantom](https://phantom.app) and create or import a wallet.
- **Devnet:** In Phantom → Settings → Developer Settings → turn on “Testnet Mode” (or change network to **Devnet**).
- Get free devnet SOL for your Phantom wallet:
  - Phantom shows your address; copy it and use [Solana Devnet Faucet](https://faucet.solana.com/) (choose Devnet), or:
  - From CLI: `solana airdrop 2 <YOUR_PHANTOM_ADDRESS>`

Use one wallet as **task creator** (needs SOL to register tasks on-chain) and, if you want to test labeling, a second wallet as **labeler** (no SOL needed to submit labels).

---

## 6. Run the full stack (recap)

You need **three** processes:

1. **Backend** (from `backend/`): `npm run dev`
2. **Frontend** (from `frontend/`): `npm run dev`
3. **Optional:** run aggregation and oracle when you have submissions (see below)

Open **http://localhost:5173**, connect Phantom (Devnet), and use the Dashboard / Creator / Labeler tabs.

---

## 7. End-to-end test

### Step 1: Create a task (Creator)

1. Connect Phantom (creator wallet).
2. Go to **Creator** tab → **Create task**.
3. Fill the form (see **Dummy examples** below), then submit.
4. Open the new task from “My tasks”.

### Step 2: Register the task on Solana (Creator)

1. On the task detail page, use **Register task on Solana**.
2. Approve the transaction in Phantom (uses a small amount of SOL).
3. The task should now show as “On-chain” in the Creator tab and on the Dashboard.

### Step 3: Label as another wallet (Labeler)

1. In Phantom, switch to a **different** wallet (or use a second browser profile with another Phantom wallet).
2. Go to **Labeler** tab → **Tasks to label (remaining)**.
3. Open the task you created, fill labels for each item, and **Submit labels** (no Solana transaction).

### Step 4: Aggregate and push to chain (backend)

In a terminal, from **`backend/`**:

```bash
cd backend
npm run aggregate
npm run oracle
```

- `aggregate`: computes majority (or single) labels and writes to `aggregated_results`.
- `oracle`: submits pending aggregated results to the Solana program (uses `oracle-keypair.json` and devnet SOL).

### Step 5: Verify

- **Dashboard:** Tasks table shows On-chain vs Pending; labelers table shows submission counts.
- **Creator:** Your task shows “On-chain” and you can open it to see items.
- **Labeler:** The task moves from “Tasks to label” to “Completed by you” once you’ve submitted all items.

---

## 8. Dummy examples for task creators

Copy-paste friendly ideas so you don’t have to brainstorm.

### Example A: Text sentiment (single choice)

- **Description:** “Classify the sentiment of each short sentence.”
- **Rubric type:** Single choice (from rubrics below)
- **Rubrics (one per line):**
  ```
  Positive
  Negative
  Neutral
  ```
- **Task type:** Text  
- **Items (one text per line):**
  ```
  The product arrived on time and works great.
  Terrible experience, never again.
  It’s okay, nothing special.
  ```

### Example B: Image yes/no (single choice)

- **Description:** “Does the image contain a cat? Answer Yes or No.”
- **Rubric type:** Single choice
- **Rubrics:**
  ```
  Yes
  No
  ```
- **Task type:** Image  
- **Items:** Use image URLs (e.g. `https://placekitten.com/200/200`) or **Upload** to add images.

### Example C: Free-text labels (open-ended)

- **Description:** “In one word, what is the main topic of the sentence?”
- **Rubric type:** Free text
- **Rubrics (optional):** Leave empty or add hints, e.g. `sports, weather, politics, other`
- **Task type:** Text  
- **Items:**
  ```
  The match was decided in the last minute.
  Heavy rain expected tomorrow.
  ```

### Example D: Spam or not (single choice)

- **Description:** “Is this message spam? Spam / Not spam.”
- **Rubric type:** Single choice
- **Rubrics:**
  ```
  Spam
  Not spam
  ```
- **Task type:** Text  
- **Items:**
  ```
  Win a free iPhone now!!! Click here!!!
  Hey, are we still on for lunch at 1pm?
  ```

Use these as templates; change descriptions, rubrics, and items as you like.

---

## 9. Troubleshooting

| Issue | What to do |
|------|------------|
| “Not in workspace” (Anchor) | Run `anchor build` / `anchor deploy` from **`anchor_data/`**, not repo root. |
| “IDL not found” (backend) | Run `anchor build` in `anchor_data/`, then `cp anchor_data/target/idl/anchor_data.json backend/idl/`. |
| “Oracle keypair not found” | In `backend/`: `solana-keygen new -o oracle-keypair.json`, then `npm run init-config`. |
| “Insufficient funds” (deploy or tx) | `solana airdrop 2` for deployer/oracle; use Devnet faucet for Phantom. |
| CORS / API errors in browser | Ensure backend is at `http://localhost:3000` and frontend at `http://localhost:5173`, or set `VITE_API_URL` to your backend URL. |
| Phantom “wrong network” | Switch Phantom to **Devnet** (Settings → Developer Settings / Network). |
| Task not in “Tasks to label” | Creator must have created the task; labeler sees only tasks where they have at least one item left to label. |

---

## 10. Optional: reset and start over

- **DB:** Delete `backend/data/labels.sqlite` (and restart backend) to clear all tasks, items, and submissions.
- **Chain:** The program and config stay on devnet; redeploy only if you change program code and run `anchor deploy` again from `anchor_data/`.
