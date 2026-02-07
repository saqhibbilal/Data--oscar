/**
 * One-time: set the oracle authority on-chain so the oracle key can submit results.
 * Run from backend/: npm run init-config
 * Requires oracle-keypair.json in backend/ (create with: solana-keygen new -o oracle-keypair.json)
 */
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

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

async function run(): Promise<void> {
  const keypairPath = process.env.ORACLE_KEYPAIR_PATH ?? path.join(process.cwd(), "oracle-keypair.json");
  if (!fs.existsSync(keypairPath)) {
    console.error("Oracle keypair not found at", keypairPath);
    console.error("Create it: solana-keygen new -o oracle-keypair.json");
    process.exit(1);
  }
  const oracleKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );

  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl);
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(oracleKeypair), {
    commitment: "confirmed",
  });
  const idl = loadIdl();
  const program = new anchor.Program(idl as anchor.Idl, provider);

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);

  try {
    const sig = await program.methods
      .initConfig(oracleKeypair.publicKey)
      .accounts({
        config: configPda,
        authority: oracleKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("init_config done. Tx:", sig);
  } catch (e: any) {
    if (e.message?.includes("already in use") || e.message?.includes("0x0")) {
      console.log("Config already set (oracle authority already registered).");
    } else {
      throw e;
    }
  }
}

run();
