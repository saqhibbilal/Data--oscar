import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "../idl/anchor_data.json";

const PROGRAM_ID = new PublicKey("5bAQ6rTErKf9A1JfTNDKsxpefmeBF87LX6uEtA1FbP8n");

function hexToBytes(hex: string, length: number): number[] {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(0, length * 2);
  const arr = new Array(length).fill(0);
  const bytes = Buffer.from(clean.padEnd(length * 2, "0"), "hex");
  for (let i = 0; i < bytes.length && i < length; i++) arr[i] = bytes[i];
  return arr;
}

export type TaskForInit = {
  owner_pubkey: string;
  dataset_ref_hex: string;
  task_type: number;
};

export async function registerTaskOnChain(
  connection: Connection,
  wallet: WalletContextState,
  task: TaskForInit
): Promise<void> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const owner = new PublicKey(task.owner_pubkey);
  if (!owner.equals(wallet.publicKey)) {
    throw new Error("Only the task owner can register this task on Solana");
  }
  const datasetRef = hexToBytes(task.dataset_ref_hex, 32);
  const provider = new anchor.AnchorProvider(
    connection,
    { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction! },
    { commitment: "confirmed" }
  );
  const program = new anchor.Program(idl as anchor.Idl, provider);
  const [taskPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("task"), owner.toBuffer(), Buffer.from(datasetRef)],
    PROGRAM_ID
  );
  await program.methods
    .initTask(datasetRef, task.task_type)
    .accounts({
      task: taskPda,
      owner: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
