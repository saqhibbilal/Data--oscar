# Data Labeling (Solana)

A small decentralized data-labeling app on Solana. Creators define text or image tasks; labelers submit labels off-chain; an oracle aggregates and publishes verified results on-chain. Reputation is tracked per labeler so contributors can build a visible history of work. Putting labels (or their commitments) on-chain gives you an auditable, tamper-resistant record—useful for training data provenance and for downstream use in contracts or rewards. Proof of reputation fits here naturally: the same chain that stores verified outcomes can attest who contributed, how much, and with what agreement rate, which opens the door to tokenomics, slashing, or reputation-based access later.

The stack is Solana (Anchor program), a Node/Express backend with SQLite, and a React + Vite frontend with Phantom (and other Solana wallets). Tasks and submissions live off-chain for cost and speed; only task registration and final aggregated results are written on-chain. This is a minimal version to validate the flow. Depending on where we want to push—staking, reputation weight, cost, or processing—we might later move to or complement with other chains or L2s.

**Flow:** Creators connect a wallet, define a task (description, rubric type, items), and create it; they can then register the task on Solana so it’s anchored on-chain. Labelers connect (same or different wallet), pick tasks from “Tasks to label,” submit labels per item (no chain tx), and see “Completed by you” and submission counts. The backend runs an aggregation step (e.g. majority vote) and an oracle script that posts pending results to the program; the dashboard shows task owners, tasks (on-chain vs pending), and labelers with their contribution counts so reputation is visible at a glance.

We plan to extend beyond text and images to multimodal inputs (e.g. audio, video) so the same pipeline can handle richer tasks.

---

## Screenshots

| Connect wallet                                          | Create task                                          | Labeler view                                     | Dashboard                                          |
| ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------- |
| ![Connect wallet](Screenshot%202026-02-08%20015119.jpg) | ![Create task](Screenshot%202026-02-08%20015152.jpg) | ![Labeler](Screenshot%202026-02-08%20015217.jpg) | ![Dashboard](Screenshot%202026-02-08%20015245.jpg) |

_Connect a Solana wallet (e.g. Phantom), define a task with description and items, label tasks and track completed work, and see owners, tasks, and labeler reputation on the dashboard._

---
