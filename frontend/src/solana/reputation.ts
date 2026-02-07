import { PublicKey } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/anchor_data.json";

const PROGRAM_ID = new PublicKey("5bAQ6rTErKf9A1JfTNDKsxpefmeBF87LX6uEtA1FbP8n");

function hexToBytes(hex: string, length: number): Buffer {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(0, length * 2);
  return Buffer.from(clean.padEnd(length * 2, "0"), "hex").subarray(0, length);
}

export type ReputationAccount = {
  verified_count: number;
  points: number;
};

export async function fetchReputationForTask(
  ownerPubkey: string,
  datasetRefHex: string,
  labelerPubkey: string,
  connection?: Connection
): Promise<ReputationAccount | null> {
  if (!connection) return null;
  const owner = new PublicKey(ownerPubkey);
  const labeler = new PublicKey(labelerPubkey);
  const datasetRef = hexToBytes(datasetRefHex, 32);
  const [taskPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("task"), owner.toBuffer(), datasetRef],
    PROGRAM_ID
  );
  const [reputationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("reputation"), taskPda.toBuffer(), labeler.toBuffer()],
    PROGRAM_ID
  );
  const accountInfo = await connection.getAccountInfo(reputationPda);
  if (!accountInfo?.data) return null;
  const program = new anchor.Program(idl as anchor.Idl, PROGRAM_ID);
  const decoded = program.coder.accounts.decode("ContributorReputation", accountInfo.data) as {
    verified_count?: number;
    verifiedCount?: number;
    points?: number | bigint;
  };
  const verified = decoded.verified_count ?? decoded.verifiedCount ?? 0;
  const points = decoded.points != null ? Number(decoded.points) : 0;
  return { verified_count: verified, points };
}
