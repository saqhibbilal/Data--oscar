import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { getDb } from "./db";

const PROGRAM_ID = new PublicKey("5bAQ6rTErKf9A1JfTNDKsxpefmeBF87LX6uEtA1FbP8n");

function loadIdl(): anchor.Idl {
  const idlPaths = [
    path.join(__dirname, "..", "idl", "anchor_data.json"),
    path.join(__dirname, "..", "..", "anchor_data", "target", "idl", "anchor_data.json"),
  ];
  for (const p of idlPaths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  }
  throw new Error("IDL not found. Copy anchor_data/target/idl/anchor_data.json to backend/idl/");
}

function hexToBytes(hex: string, length: number): Buffer {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(0, length * 2);
  const buf = Buffer.alloc(length);
  Buffer.from(clean.padEnd(length * 2, "0"), "hex").copy(buf, 0, 0, length);
  return buf;
}

function resultHash(taskPda: PublicKey, itemId: Buffer, finalLabel: Buffer, confidence: number): Buffer {
  const h = createHash("sha256");
  h.update(taskPda.toBuffer());
  h.update(itemId);
  h.update(finalLabel);
  h.update(Buffer.from([confidence >> 8, confidence & 0xff]));
  return h.digest();
}

async function run(): Promise<void> {
  const keypairPath = process.env.ORACLE_KEYPAIR_PATH ?? path.join(process.cwd(), "oracle-keypair.json");
  if (!fs.existsSync(keypairPath)) {
    console.error("Oracle keypair not found at", keypairPath);
    console.error("Generate with: solana-keygen new -o oracle-keypair.json");
    process.exit(1);
  }
  const oracleKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );

  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl);
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(oracleKeypair), {
    commitment: "confirmed",
  });
  const idl = loadIdl();
  const program = new anchor.Program(idl as anchor.Idl, provider);

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ar.id, ar.task_id, ar.item_id_hex, ar.final_label_hex, ar.confidence, ar.representative_labeler_pubkey,
              t.owner_pubkey, t.dataset_ref_hex
       FROM aggregated_results ar
       JOIN tasks t ON ar.task_id = t.id
       WHERE ar.submitted_to_chain = 0`
    )
    .all() as Array<{
    id: number;
    task_id: number;
    item_id_hex: string;
    final_label_hex: string;
    confidence: number;
    representative_labeler_pubkey: string | null;
    owner_pubkey: string;
    dataset_ref_hex: string;
  }>;

  if (rows.length === 0) {
    console.log("No pending results to submit.");
    return;
  }

  const markSubmitted = db.prepare("UPDATE aggregated_results SET submitted_to_chain = 1 WHERE id = ?");

  for (const row of rows) {
    const owner = new PublicKey(row.owner_pubkey);
    const datasetRef = hexToBytes(row.dataset_ref_hex, 32);
    const [taskPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), owner.toBuffer(), datasetRef],
      PROGRAM_ID
    );

    const itemId = hexToBytes(row.item_id_hex, 32);
    const finalLabel = hexToBytes(row.final_label_hex, 64);
    const confidence = Math.min(65535, Math.max(0, row.confidence));
    const resultHashBuf = resultHash(taskPda, itemId, finalLabel, confidence);

    const labelerPubkey = row.representative_labeler_pubkey
      ? new PublicKey(row.representative_labeler_pubkey)
      : oracleKeypair.publicKey;

    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
    const [verifiedResultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("result"), taskPda.toBuffer(), itemId],
      PROGRAM_ID
    );
    const [reputationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("reputation"), taskPda.toBuffer(), labelerPubkey.toBuffer()],
      PROGRAM_ID
    );

    try {
      await program.methods
        .submitVerifiedResult(
          Array.from(itemId),
          Array.from(finalLabel),
          confidence,
          Array.from(resultHashBuf)
        )
        .accounts({
          config: configPda,
          oracle: oracleKeypair.publicKey,
          task: taskPda,
          verifiedResult: verifiedResultPda,
          reputation: reputationPda,
          labeler: labelerPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      markSubmitted.run(row.id);
      console.log("Submitted result id", row.id, "task", row.task_id, "item", row.item_id_hex.slice(0, 16) + "...");
    } catch (e) {
      console.error("Failed to submit result id", row.id, e);
    }
  }
}

run();
