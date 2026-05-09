// ============================================================================
//  trust_registry — lib.rs
//  Cypher Forensic Audit System · Hackathon Dev3Pack
// ============================================================================
//
//  Purpose
//  -------
//  This Anchor program acts as an *immutable, on-chain Trust Registry*.
//  The Cypher backend (Python / FastAPI) calls these instructions after
//  completing a risk analysis, permanently recording the findings on Solana.
//
//  Because Solana accounts are rent-exempt once funded and PDAs are
//  deterministic, every entry in this registry is:
//    • Tamper-proof  — no private key controls the PDA; only this program
//                      can write to it.
//    • Publicly verifiable — anyone can derive the PDA for any address and
//                      read the stored report without trusting the backend.
//    • Permanent     — the account persists as long as it stays rent-exempt.
//
//  Account Layout (AnalysisReport)
//  --------------------------------
//    Discriminator  [u8; 8]   — Anchor's unique account tag (auto-managed)
//    target         Pubkey    — The Solana address that was audited.
//    inspector      Pubkey    — Backend wallet that submitted the report.
//    report_hash    [u8; 32]  — SHA-256 of the full AI-generated JSON report.
//    risk_score     u8        — 0–100 composite score from the Risk Engine.
//    severity       u8        — 0 = BAJO, 1 = MEDIO, 2 = CRÍTICO
//    flags_count    u8        — Number of risk flags that fired.
//    timestamp      i64       — Unix timestamp (seconds) of the analysis.
//    bump           u8        — PDA canonical bump, stored for cheap re-use.
//
//  Instructions
//  ------------
//    initialize_report   — Create a new PDA account and record the first report.
//    update_report       — Overwrite an existing report (inspector-only).
//    close_report        — Reclaim rent by closing the PDA (inspector-only,
//                          included for dev/test; remove in mainnet if desired).
//
// ============================================================================

use anchor_lang::prelude::*;

// ── Program ID ───────────────────────────────────────────────────────────────
// Replace with the actual ID after `anchor build` outputs it.
// Run: `solana-keygen grind --starts-with cph:1` for a vanity address.
declare_id!("CyphQT2vMp4UNGy9P7TFMqT6CybNGKFsTFHr6V9XXXXX");

// ── Constants ─────────────────────────────────────────────────────────────────

/// PDA seed prefix — keeps the namespace clean if other programs share keys.
const ANALYSIS_SEED: &[u8] = b"analysis";

/// Maximum risk score value (enforced on-chain to reject bad data).
const MAX_RISK_SCORE: u8 = 100;

/// Severity levels — mirrored from the Python Risk Engine.
pub mod severity {
    pub const LOW: u8      = 0;
    pub const MEDIUM: u8   = 1;
    pub const CRITICAL: u8 = 2;
}

// ── Space calculation ─────────────────────────────────────────────────────────
//
//  Anchor's #[account] macro adds an 8-byte discriminator automatically.
//  We calculate space explicitly so the reader can audit it line-by-line:
//
//    discriminator    8
//    target           32   (Pubkey)
//    inspector        32   (Pubkey)
//    report_hash      32   ([u8; 32])
//    risk_score        1   (u8)
//    severity          1   (u8)
//    flags_count       1   (u8)
//    timestamp         8   (i64)
//    bump              1   (u8)
//    ─────────────────────
//    TOTAL           116 bytes
//
impl AnalysisReport {
    pub const SPACE: usize =
        8    // discriminator
        + 32 // target
        + 32 // inspector
        + 32 // report_hash
        + 1  // risk_score
        + 1  // severity
        + 1  // flags_count
        + 8  // timestamp
        + 1; // bump
}

// ── Program module ────────────────────────────────────────────────────────────

#[program]
pub mod trust_registry {
    use super::*;

    // ────────────────────────────────────────────────────────────────────────
    /// Create a new `AnalysisReport` PDA for `target`.
    ///
    /// Seeds: `["analysis", target.key()]`
    ///
    /// The PDA is unique per target address, so each audited token/contract
    /// gets exactly one canonical account in the registry.
    ///
    /// # Parameters
    /// - `risk_score`   — 0–100 composite score (validated on-chain).
    /// - `severity`     — 0 BAJO / 1 MEDIO / 2 CRÍTICO.
    /// - `flags_count`  — Number of rule flags that fired in the analysis.
    /// - `report_hash`  — SHA-256([u8;32]) of the full JSON report stored
    ///                    off-chain (IPFS / S3).  Allows anyone to verify
    ///                    the report content hasn't been tampered with.
    // ────────────────────────────────────────────────────────────────────────
    pub fn initialize_report(
        ctx: Context<InitializeReport>,
        risk_score: u8,
        severity: u8,
        flags_count: u8,
        report_hash: [u8; 32],
    ) -> Result<()> {
        // ── Input validation ─────────────────────────────────────────────────
        require!(risk_score <= MAX_RISK_SCORE, CypherError::InvalidRiskScore);
        require!(severity <= severity::CRITICAL,  CypherError::InvalidSeverity);

        // ── Populate account ─────────────────────────────────────────────────
        let report = &mut ctx.accounts.report;
        let clock  = Clock::get()?;

        report.target      = ctx.accounts.target.key();
        report.inspector   = ctx.accounts.inspector.key();
        report.report_hash = report_hash;
        report.risk_score  = risk_score;
        report.severity    = severity;
        report.flags_count = flags_count;
        report.timestamp   = clock.unix_timestamp;
        report.bump        = ctx.bumps.report;

        // ── Emit event for off-chain indexers ────────────────────────────────
        emit!(ReportCreated {
            target:     report.target,
            inspector:  report.inspector,
            risk_score,
            severity,
            timestamp:  report.timestamp,
        });

        msg!(
            "[Cypher] Report initialized | target={} score={} severity={}",
            report.target,
            risk_score,
            severity,
        );

        Ok(())
    }

    // ────────────────────────────────────────────────────────────────────────
    /// Update an existing `AnalysisReport`.
    ///
    /// Only the **original inspector** may call this instruction.
    /// This preserves accountability: the wallet that created the report
    /// is the only entity authorised to revise it.
    ///
    /// Use case: re-running the analysis after new on-chain data is available
    /// (e.g., mint authority was revoked post-listing).
    // ────────────────────────────────────────────────────────────────────────
    pub fn update_report(
        ctx: Context<UpdateReport>,
        risk_score: u8,
        severity: u8,
        flags_count: u8,
        report_hash: [u8; 32],
    ) -> Result<()> {
        // ── Input validation ─────────────────────────────────────────────────
        require!(risk_score <= MAX_RISK_SCORE, CypherError::InvalidRiskScore);
        require!(severity <= severity::CRITICAL,  CypherError::InvalidSeverity);

        // ── Update mutable fields (target & inspector are immutable) ─────────
        let report = &mut ctx.accounts.report;
        let clock  = Clock::get()?;

        report.report_hash = report_hash;
        report.risk_score  = risk_score;
        report.severity    = severity;
        report.flags_count = flags_count;
        report.timestamp   = clock.unix_timestamp; // track most recent update

        emit!(ReportUpdated {
            target:    report.target,
            inspector: report.inspector,
            risk_score,
            severity,
            timestamp: report.timestamp,
        });

        msg!(
            "[Cypher] Report updated | target={} new_score={} new_severity={}",
            report.target,
            risk_score,
            severity,
        );

        Ok(())
    }

    // ────────────────────────────────────────────────────────────────────────
    /// Close the PDA and reclaim the lamports to the inspector.
    ///
    /// Useful during development / testing.  In production you may want to
    /// remove this instruction or guard it with an on-chain authority account
    /// to prevent accidental deletion of public records.
    // ────────────────────────────────────────────────────────────────────────
    pub fn close_report(_ctx: Context<CloseReport>) -> Result<()> {
        // Anchor's `close = inspector` constraint handles the lamport transfer
        // and account zeroing automatically.  Nothing extra needed here.
        msg!("[Cypher] Report closed and rent reclaimed.");
        Ok(())
    }
}

// ── Account structs ───────────────────────────────────────────────────────────

/// The permanent on-chain record of one risk analysis.
#[account]
#[derive(Debug)]
pub struct AnalysisReport {
    /// The Solana address that was audited (token mint, program, wallet…).
    pub target: Pubkey,

    /// The backend wallet (authority) that performed and signed the analysis.
    pub inspector: Pubkey,

    /// SHA-256 of the full JSON report stored off-chain (IPFS / S3 / Arweave).
    /// Anyone can verify report integrity: sha256(raw_json) == report_hash.
    pub report_hash: [u8; 32],

    /// Composite risk score from the Python Risk Engine (0 = safe, 100 = critical).
    pub risk_score: u8,

    /// Severity label: 0 = BAJO, 1 = MEDIO, 2 = CRÍTICO.
    pub severity: u8,

    /// Number of individual risk flags that fired (audit trail granularity).
    pub flags_count: u8,

    /// Unix timestamp (seconds) of when this analysis was recorded on-chain.
    pub timestamp: i64,

    /// Canonical PDA bump — stored so instructions can re-derive the PDA
    /// without an additional seeds iteration.
    pub bump: u8,
}

// ── Instruction contexts (Accounts validation) ────────────────────────────────

/// Accounts for `initialize_report`.
#[derive(Accounts)]
pub struct InitializeReport<'info> {
    /// CHECK: This is the address being audited.  We only read its public key,
    /// so no ownership or type check is required.  The Anchor `CHECK` comment
    /// is mandatory to acknowledge we've deliberately skipped the check.
    pub target: UncheckedAccount<'info>,

    /// The backend wallet paying rent and signing the transaction.
    /// Marked `mut` so lamports can be deducted for the new account.
    #[account(mut)]
    pub inspector: Signer<'info>,

    /// The PDA that will store the analysis report.
    ///
    /// Seeds:  `["analysis", target.key()]`
    /// Payer:  `inspector`   — the backend wallet funds the rent.
    /// Space:  `AnalysisReport::SPACE`
    ///
    /// Using `init` ensures this instruction fails if an account for this
    /// target already exists (idempotency guard — use `update_report` instead).
    #[account(
        init,
        payer  = inspector,
        space  = AnalysisReport::SPACE,
        seeds  = [ANALYSIS_SEED, target.key().as_ref()],
        bump,
    )]
    pub report: Account<'info, AnalysisReport>,

    /// Required by Anchor when creating new accounts.
    pub system_program: Program<'info, System>,
}

/// Accounts for `update_report`.
#[derive(Accounts)]
pub struct UpdateReport<'info> {
    /// CHECK: Same rationale as InitializeReport — we only use the key.
    pub target: UncheckedAccount<'info>,

    /// Must be the SAME inspector that originally created the report.
    /// The `has_one` constraint on `report` enforces this relationship.
    pub inspector: Signer<'info>,

    /// The existing PDA.
    ///
    /// `has_one = inspector` — Anchor automatically checks that
    /// `report.inspector == inspector.key()`, rejecting unauthorized callers.
    ///
    /// `mut` — we need to write updated fields.
    #[account(
        mut,
        has_one = inspector @ CypherError::Unauthorized,
        seeds   = [ANALYSIS_SEED, target.key().as_ref()],
        bump    = report.bump,
    )]
    pub report: Account<'info, AnalysisReport>,
}

/// Accounts for `close_report`.
#[derive(Accounts)]
pub struct CloseReport<'info> {
    /// CHECK: We only need the key to derive the PDA.
    pub target: UncheckedAccount<'info>,

    /// Must be the original inspector to prevent griefing attacks.
    #[account(mut)]
    pub inspector: Signer<'info>,

    /// `close = inspector` — Anchor zeroes the account data, removes the
    /// discriminator, and transfers remaining lamports to `inspector`.
    #[account(
        mut,
        has_one = inspector @ CypherError::Unauthorized,
        close   = inspector,
        seeds   = [ANALYSIS_SEED, target.key().as_ref()],
        bump    = report.bump,
    )]
    pub report: Account<'info, AnalysisReport>,
}

// ── Events (for Geyser / off-chain indexers) ──────────────────────────────────

/// Emitted whenever a new report is created.
/// Off-chain indexers (e.g., The Graph, Helius webhooks) can subscribe to
/// this event to build a real-time dashboard without polling every account.
#[event]
pub struct ReportCreated {
    pub target:     Pubkey,
    pub inspector:  Pubkey,
    pub risk_score: u8,
    pub severity:   u8,
    pub timestamp:  i64,
}

/// Emitted whenever an existing report is updated.
#[event]
pub struct ReportUpdated {
    pub target:     Pubkey,
    pub inspector:  Pubkey,
    pub risk_score: u8,
    pub severity:   u8,
    pub timestamp:  i64,
}

// ── Custom errors ─────────────────────────────────────────────────────────────

#[error_code]
pub enum CypherError {
    /// risk_score was above 100 — invalid data from the backend.
    #[msg("Risk score must be between 0 and 100.")]
    InvalidRiskScore,

    /// severity was > 2 — not a recognised level.
    #[msg("Severity must be 0 (BAJO), 1 (MEDIO), or 2 (CRITICO).")]
    InvalidSeverity,

    /// The signer is not the inspector that originally created the report.
    #[msg("Only the original inspector can modify this report.")]
    Unauthorized,
}

// ── Unit tests ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // Verify the space constant matches the actual struct layout.
    // This test catches accidental field additions that break on-chain accounts.
    #[test]
    fn test_space_calculation() {
        // std::mem::size_of does NOT include the 8-byte Anchor discriminator,
        // so we add it manually to match AnalysisReport::SPACE.
        let struct_size = std::mem::size_of::<AnalysisReport>();
        assert_eq!(
            struct_size + 8,
            AnalysisReport::SPACE,
            "AnalysisReport::SPACE is out of sync with the struct layout. \
             Update the constant to {} bytes.",
            struct_size + 8
        );
    }

    #[test]
    fn test_severity_constants_are_ordered() {
        assert!(severity::LOW < severity::MEDIUM);
        assert!(severity::MEDIUM < severity::CRITICAL);
    }

    #[test]
    fn test_max_risk_score_is_100() {
        assert_eq!(MAX_RISK_SCORE, 100);
    }
}
