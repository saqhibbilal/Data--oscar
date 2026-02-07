use anchor_lang::prelude::*;

declare_id!("5bAQ6rTErKf9A1JfTNDKsxpefmeBF87LX6uEtA1FbP8n");

#[program]
pub mod anchor_data {
    use super::*;

    /// Initialize global program config (oracle authority). Call once, e.g. by deployer.
    pub fn init_config(ctx: Context<InitConfig>, oracle_authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.oracle_authority = oracle_authority;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Dataset owner creates a task. Seeds: task + owner + dataset_ref.
    pub fn init_task(
        ctx: Context<InitTask>,
        dataset_ref: [u8; 32],
        task_type: u8,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task;
        task.owner = ctx.accounts.owner.key();
        task.dataset_ref = dataset_ref;
        task.task_type = task_type;
        task.bump = ctx.bumps.task;
        task.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Oracle only: submit verified label result and update contributor reputation.
    pub fn submit_verified_result(
        ctx: Context<SubmitVerifiedResult>,
        item_id: [u8; 32],
        final_label: [u8; 64],
        confidence: u16,
        result_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            ctx.accounts.config.oracle_authority == ctx.accounts.oracle.key(),
            ErrorCode::InvalidOracle
        );

        let result = &mut ctx.accounts.verified_result;
        result.task = ctx.accounts.task.key();
        result.item_id = item_id;
        result.final_label = final_label;
        result.confidence = confidence;
        result.result_hash = result_hash;
        result.submitted_at = Clock::get()?.unix_timestamp;

        let rep = &mut ctx.accounts.reputation;
        rep.labeler = ctx.accounts.labeler.key();
        rep.task = ctx.accounts.task.key();
        rep.verified_count = rep.verified_count.saturating_add(1);
        Ok(())
    }

    /// Optional: credit points to a labeler (owner or oracle).
    pub fn add_reputation_points(ctx: Context<AddReputationPoints>, points: u64) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        rep.points = rep.points.saturating_add(points);
        Ok(())
    }
}

// ---------- Config ----------

#[account]
pub struct ProgramConfig {
    pub oracle_authority: Pubkey,
    pub bump: u8,
}

// ---------- Task (dataset owner) ----------

#[account]
pub struct TaskConfig {
    pub owner: Pubkey,
    pub dataset_ref: [u8; 32],
    pub task_type: u8,
    pub bump: u8,
    pub created_at: i64,
}

// ---------- Verified result (written by oracle) ----------

#[account]
pub struct VerifiedResult {
    pub task: Pubkey,
    pub item_id: [u8; 32],
    pub final_label: [u8; 64],
    pub confidence: u16,
    pub result_hash: [u8; 32],
    pub submitted_at: i64,
}

// ---------- Contributor reputation ----------

#[account]
pub struct ContributorReputation {
    pub labeler: Pubkey,
    pub task: Pubkey,
    pub verified_count: u32,
    pub points: u64,
}

// ---------- InitConfig ----------

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ---------- InitTask ----------

#[derive(Accounts)]
#[instruction(dataset_ref: [u8; 32])]
pub struct InitTask<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 1 + 1 + 8,
        seeds = [b"task", owner.key().as_ref(), dataset_ref.as_ref()],
        bump
    )]
    pub task: Account<'info, TaskConfig>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ---------- SubmitVerifiedResult (oracle only) ----------

#[derive(Accounts)]
#[instruction(item_id: [u8; 32])]
pub struct SubmitVerifiedResult<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub oracle: Signer<'info>,

    pub task: Account<'info, TaskConfig>,

    #[account(
        init_if_needed,
        payer = oracle,
        space = 8 + 32 + 32 + 64 + 2 + 32 + 8,
        seeds = [b"result", task.key().as_ref(), item_id.as_ref()],
        bump
    )]
    pub verified_result: Account<'info, VerifiedResult>,

    #[account(
        init_if_needed,
        payer = oracle,
        space = 8 + 32 + 32 + 4 + 8,
        seeds = [b"reputation", task.key().as_ref(), labeler.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, ContributorReputation>,

    /// Labeler to attribute this verified submission to.
    /// CHECK: Store pubkey for reputation; no validation needed.
    pub labeler: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// ---------- AddReputationPoints ----------

#[derive(Accounts)]
pub struct AddReputationPoints<'info> {
    #[account(
        mut,
        seeds = [b"reputation", reputation.task.as_ref(), reputation.labeler.as_ref()],
        bump,
        constraint = reputation.task == task.key()
    )]
    pub reputation: Account<'info, ContributorReputation>,

    #[account(constraint = task.owner == authority.key())]
    pub task: Account<'info, TaskConfig>,

    pub authority: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Signer is not the designated oracle authority")]
    InvalidOracle,
}
