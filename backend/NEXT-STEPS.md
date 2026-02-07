# What to do next (build, deploy, npm install, dev are already done)

All from the **backend** folder.

1. **Create the oracle keypair** (if you don’t have it yet)  
   ```bash
   solana-keygen new -o oracle-keypair.json
   ```  
   Put the file in **backend** (or set `ORACLE_KEYPAIR_PATH` to its path).

2. **Give the oracle key some devnet SOL**  
   Get the address:
   ```bash
   solana address -k oracle-keypair.json
   ```  
   Then airdrop to that address (e.g. from Solana docs/devnet faucet), or:
   ```bash
   solana airdrop 2 --keypair oracle-keypair.json
   ```

3. **Register the oracle on-chain (one time)**  
   ```bash
   npm run init-config
   ```  
   This calls `init_config` with your oracle pubkey so only this key can submit results.

4. **When you have labels to push**  
   - `npm run aggregate`  
   - `npm run oracle`  

That’s it.
