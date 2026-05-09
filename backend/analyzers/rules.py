"""
analyzers/rules.py
------------------
Concrete implementations of RiskRule.

Each class encapsulates exactly ONE security concern, making them trivially
unit-testable and independently extendable.  Adding a new rule means creating
a new class here and registering it in RiskAnalyzer — nothing else changes.

Rule severity weights are chosen to reflect real-world Solana rug-pull
patterns (mint authority is the biggest red flag, followed by freeze, then
a failed simulation, and finally supply concentration).
"""

from __future__ import annotations

from typing import Any

from .base import RiskFlag, RiskRule


# ---------------------------------------------------------------------------
# Rule 1: Mint Authority
# ---------------------------------------------------------------------------

class MintAuthorityRule(RiskRule):
    """
    Detect whether the SPL Token's Mint Authority is still enabled.

    Security context
    ----------------
    The Mint Authority is the account allowed to *print new tokens* out of
    thin air.  If the creator retains this authority, they can dilute every
    holder's position at any moment — the textbook mechanism of a rug-pull.

    A trustworthy token should have its mint authority **revoked** (set to
    None / COption::None in the on-chain layout) before or shortly after the
    TGE (Token Generation Event).

    Severity contribution: 45 points (highest weight — critical vector).
    """

    _SEVERITY: int = 45

    def check(self, context: dict[str, Any]) -> RiskFlag | None:
        if context.get("mint_authority_enabled"):
            return RiskFlag(
                rule_name=self.name,
                description=(
                    "Mint Authority active: the creator can issue unlimited tokens, "
                    "diluting the value for existing holders (primary rug-pull vector)."
                ),
                severity=self._SEVERITY,
            )
        return None


# ---------------------------------------------------------------------------
# Rule 2: Freeze Authority
# ---------------------------------------------------------------------------

class FreezeAuthorityRule(RiskRule):
    """
    Detect whether the SPL Token's Freeze Authority is still active.

    Security context
    ----------------
    The Freeze Authority allows the issuer to freeze *any* associated token
    account, effectively making a holder's tokens non-transferable.  This is
    the on-chain mechanism behind "honeypot" tokens: you can buy, but you can
    never sell.

    Some legitimate projects (e.g., stablecoins with regulatory requirements)
    keep this authority intentionally.  The rule flags it for transparency; the
    AI explanation adds nuance about potential legitimate uses.

    Severity contribution: 35 points.
    """

    _SEVERITY: int = 35

    def check(self, context: dict[str, Any]) -> RiskFlag | None:
        if context.get("freeze_authority_enabled"):
            return RiskFlag(
                rule_name=self.name,
                description=(
                    "Freeze Authority active: the issuer can freeze token accounts "
                    "of any holder, preventing transfers or sales (honeypot pattern)."
                ),
                severity=self._SEVERITY,
            )
        return None


# ---------------------------------------------------------------------------
# Rule 3: Transaction Simulation
# ---------------------------------------------------------------------------

class SimulationSuccessRule(RiskRule):
    """
    Analyse whether a provided transaction simulation completed without errors.

    Security context
    ----------------
    Simulating a sell/swap transaction *before* sending it on-chain is a
    powerful heuristic: if the simulation reverts, the real transaction will
    almost certainly fail too.  Common causes in malicious tokens:
      • Custom transfer hooks that block sells.
      • Blacklist checks inside the token program.
      • Slippage manipulation that makes the swap mathematically invalid.

    This rule only fires when a transaction is provided (``simulation_success``
    key present in context).  If no transaction was submitted the rule is a
    no-op, keeping the score unaffected.

    Severity contribution: 20 points.
    """

    _SEVERITY: int = 20

    def check(self, context: dict[str, Any]) -> RiskFlag | None:
        # Key absent → no simulation provided; rule is not applicable.
        if "simulation_success" not in context:
            return None

        if not context["simulation_success"]:
            error_detail = context.get("simulation_error", "Error desconocido")
            return RiskFlag(
                rule_name=self.name,
                description=(
                    f"Transaction simulation failed: '{error_detail}'. "
                    "The actual transaction will likely revert — possible honeypot or "
                    "hidden transfer restriction."
                ),
                severity=self._SEVERITY,
            )
        return None


# ---------------------------------------------------------------------------
# Rule 4: Supply Concentration (bonus rule — demonstrates extensibility)
# ---------------------------------------------------------------------------

class SupplyConcentrationRule(RiskRule):
    """
    Flag tokens where a disproportionate share of supply is held by one wallet.

    Security context
    ----------------
    When a single wallet (often the deployer) holds >80 % of the circulating
    supply, a coordinated dump can collapse the price instantly.  This is the
    "whale dump" variant of a rug-pull.

    The rule expects ``top_holder_pct`` (float 0–100) in the context.  If the
    data is not available (e.g., the caller didn't fetch holder distribution),
    the rule silently skips — maintaining the composable, optional-data design.

    Severity contribution: 25 points when threshold exceeded.
    """

    _SEVERITY: int = 25
    _THRESHOLD_PCT: float = 80.0

    def check(self, context: dict[str, Any]) -> RiskFlag | None:
        top_pct: float | None = context.get("top_holder_pct")
        if top_pct is None:
            return None  # Data not available; skip gracefully.

        if top_pct >= self._THRESHOLD_PCT:
            return RiskFlag(
                rule_name=self.name,
                description=(
                    f"Critical supply concentration: the top wallet holds "
                    f"{top_pct:.1f}% of the circulating supply. "
                    "A coordinated dump could collapse the price in seconds."
                ),
                severity=self._SEVERITY,
            )
        return None
