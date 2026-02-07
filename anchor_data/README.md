# Anchor program – decentralized data labeling (Phase 1)

On-chain program for verified labeling results, task config, and contributor reputation.

## Layout

- **Program:** `programs/anchor_data/src/lib.rs`
- **Accounts:** `ProgramConfig`, `TaskConfig`, `VerifiedResult`, `ContributorReputation`
- **Instructions:** `init_config`, `init_task`, `submit_verified_result`, `add_reputation_points`

## Prerequisites (your checklist)

- Rust (rustup), Solana CLI, Anchor (avm)
- `solana config set --url devnet`
- Keypair: `solana-keygen new` (or use existing)
- Devnet SOL: `solana airdrop 2`

## Build and deploy

From this directory (`anchor_data/`):

```bash
anchor build
anchor deploy
```

- **First build:** Program ID is set in `declare_id!` and in `Anchor.toml`. If you run `anchor keys list` and get a different ID after changing the program, update both and rebuild.
- **Windows:** If deploy fails on wallet path, set an absolute path in `Anchor.toml` under `[provider]` → `wallet`, e.g. `wallet = "C:\\Users\\USER\\.config\\solana\\id.json"`.

## After deploy

1. Call **init_config** once with the oracle keypair pubkey (the key you will use for the Phase 3 oracle script).
2. Dataset owners call **init_task**(dataset_ref, task_type) to create a task.
3. Only the configured oracle can call **submit_verified_result**; it writes verified results and updates contributor reputation.
4. Task owners can call **add_reputation_points** to credit labelers.

IDL is generated at `target/idl/anchor_data.json`. Copy it to the frontend when starting Phase 4.
