// ============================================================================
//  trust_registry — lib.rs
//  Cypher Forensic Audit System · Hackathon Dev3Pack
//
//  Este código es el que está desplegado en Devnet vía Solana Playground.
//  Program ID: HQtLF8KAA5B2iRXgr1Pjdb7DEFiWPWVrp1UXQrhKm5o1
// ============================================================================
//
//  Propósito
//  ---------
//  Actúa como un Registro de Confianza inmutable on-chain.
//  El backend de Cypher (FastAPI/Python) llama a estas instrucciones
//  después de completar un análisis de riesgo, grabando los resultados
//  permanentemente en Solana mediante PDAs.
//
//  Cuenta AnalysisReport (space = 120 bytes)
//  ------------------------------------------
//    Discriminador  [u8; 8]   — Tag único de Anchor (auto-gestionado)
//    target         Pubkey    — Dirección del token/contrato auditado  (32 B)
//    inspector      Pubkey    — Wallet del backend que firmó el análisis (32 B)
//    report_hash    [u8; 32]  — SHA-256 del informe JSON completo       (32 B)
//    risk_score     u8        — Score 0-100 del Risk Engine              (1 B)
//    severity       u8        — 0=BAJO  1=MEDIO  2=CRÍTICO              (1 B)
//    flags_count    u8        — Nº de reglas que dispararon             (1 B)
//    timestamp      i64       — Unix timestamp del análisis             (8 B)
//    bump           u8        — Bump canónico del PDA                   (1 B)
//    ─────────────────────────────────────────────────────────────
//    TOTAL             8 + 32 + 32 + 32 + 1 + 1 + 1 + 8 + 1 = 116 B
//    (con 4 bytes de padding → space = 120 B)
//
//  Instrucciones
//  -------------
//    initialize_report  — Crea el PDA para un target nuevo.
//    update_report      — Actualiza un reporte existente (solo el inspector original).
//    close_report       — Cierra el PDA y recupera el SOL (solo el inspector original).
// ============================================================================

use anchor_lang::prelude::*;

declare_id!("HQtLF8KAA5B2iRXgr1Pjdb7DEFiWPWVrp1UXQrhKm5o1");

// ── Program module ────────────────────────────────────────────────────────────

#[program]
pub mod trust_registry {
    use super::*;

    // ────────────────────────────────────────────────────────────────────────
    /// Crea un nuevo PDA AnalysisReport para `target`.
    ///
    /// Seeds: `[b"analysis", target.key()]`
    ///
    /// Payer: `inspector` — el backend paga el rent del PDA.
    /// Cada dirección de Solana tiene exactamente un PDA canónico en el
    /// registro, lo que garantiza unicidad y verificabilidad pública.
    // ────────────────────────────────────────────────────────────────────────
    pub fn initialize_report(
        ctx: Context<InitializeReport>,
        risk_score: u8,
        severity: u8,
        flags_count: u8,
        report_hash: [u8; 32],
    ) -> Result<()> {
        let report = &mut ctx.accounts.report;

        report.target      = ctx.accounts.target.key();
        report.inspector   = ctx.accounts.inspector.key();
        report.report_hash = report_hash;
        report.risk_score  = risk_score;
        report.severity    = severity;
        report.flags_count = flags_count;
        report.timestamp   = Clock::get()?.unix_timestamp;
        report.bump        = ctx.bumps.report;

        Ok(())
    }

    // ────────────────────────────────────────────────────────────────────────
    /// Actualiza un AnalysisReport existente.
    ///
    /// `has_one = inspector` garantiza que solo el inspector original
    /// puede modificar el reporte — Anchor rechaza a cualquier otro firmante.
    // ────────────────────────────────────────────────────────────────────────
    pub fn update_report(
        ctx: Context<UpdateReport>,
        risk_score: u8,
        severity: u8,
        flags_count: u8,
        report_hash: [u8; 32],
    ) -> Result<()> {
        let report = &mut ctx.accounts.report;

        report.report_hash = report_hash;
        report.risk_score  = risk_score;
        report.severity    = severity;
        report.flags_count = flags_count;
        report.timestamp   = Clock::get()?.unix_timestamp;

        Ok(())
    }

    // ────────────────────────────────────────────────────────────────────────
    /// Cierra el PDA y devuelve el rent al inspector.
    ///
    /// Anchor gestiona automáticamente el cierre mediante `close = inspector`.
    // ────────────────────────────────────────────────────────────────────────
    pub fn close_report(_ctx: Context<CloseReport>) -> Result<()> {
        Ok(())
    }
}

// ── Cuenta on-chain ───────────────────────────────────────────────────────────

/// Registro permanente de un análisis forense de Cypher.
#[account]
pub struct AnalysisReport {
    /// Dirección del token/contrato/wallet que fue auditado.
    pub target: Pubkey,        // 32 bytes

    /// Wallet del backend que realizó y firmó el análisis.
    pub inspector: Pubkey,     // 32 bytes

    /// SHA-256 del JSON completo del informe (permite verificar integridad off-chain).
    pub report_hash: [u8; 32], // 32 bytes

    /// Score compuesto del Risk Engine (0 = seguro, 100 = crítico).
    pub risk_score: u8,        // 1 byte

    /// Nivel de severidad: 0 = BAJO, 1 = MEDIO, 2 = CRÍTICO.
    pub severity: u8,          // 1 byte

    /// Número de reglas de riesgo que dispararon en el análisis.
    pub flags_count: u8,       // 1 byte

    /// Unix timestamp (segundos) de cuando se grabó el análisis.
    pub timestamp: i64,        // 8 bytes

    /// Bump canónico del PDA, guardado para re-derivación eficiente.
    pub bump: u8,              // 1 byte
}

// ── Contextos de instrucción (validación de cuentas) ─────────────────────────

/// Cuentas para `initialize_report`.
#[derive(Accounts)]
pub struct InitializeReport<'info> {
    /// CHECK: Solo necesitamos la clave pública del target como seed del PDA.
    /// No hay comprobación de tipo/ownership porque auditamos cualquier dirección.
    pub target: UncheckedAccount<'info>,

    /// El backend paga el rent del nuevo PDA y firma la transacción.
    #[account(mut)]
    pub inspector: Signer<'info>,

    /// El PDA que almacena el reporte.
    /// `init` falla si ya existe una cuenta para este target (usa update_report).
    #[account(
        init,
        payer  = inspector,
        space  = 120,   // 8 discriminador + 108 datos + 4 padding
        seeds  = [b"analysis", target.key().as_ref()],
        bump,
    )]
    pub report: Account<'info, AnalysisReport>,

    /// Requerido por Anchor para crear nuevas cuentas.
    pub system_program: Program<'info, System>,
}

/// Cuentas para `update_report`.
#[derive(Accounts)]
pub struct UpdateReport<'info> {
    /// CHECK: Solo necesitamos la clave pública para derivar el PDA.
    pub target: UncheckedAccount<'info>,

    /// Debe ser el MISMO inspector que creó el reporte.
    /// `has_one = inspector` lo valida automáticamente.
    pub inspector: Signer<'info>,

    #[account(
        mut,
        has_one = inspector,
        seeds   = [b"analysis", target.key().as_ref()],
        bump    = report.bump,
    )]
    pub report: Account<'info, AnalysisReport>,
}

/// Cuentas para `close_report`.
#[derive(Accounts)]
pub struct CloseReport<'info> {
    /// CHECK: Solo necesitamos la clave pública para derivar el PDA.
    pub target: UncheckedAccount<'info>,

    /// Solo el inspector original puede cerrar el reporte.
    #[account(mut)]
    pub inspector: Signer<'info>,

    /// `close = inspector` hace que Anchor transfiera los lamports al inspector
    /// y limpie los datos de la cuenta.
    #[account(
        mut,
        has_one = inspector,
        close   = inspector,
        seeds   = [b"analysis", target.key().as_ref()],
        bump    = report.bump,
    )]
    pub report: Account<'info, AnalysisReport>,
}
