"""
services/registry_service.py
-----------------------------
Python client that lets the Cypher backend submit RiskReport results
to the on-chain Trust Registry Anchor program.

This module bridges the Python Risk Engine (analyzers/) with the Rust
smart contract (contracts/trust_registry/), closing the full audit loop:

    [Token Address]
         │
         ▼
    Python RiskAnalyzer   →  RiskReport (score, flags…)
         │
         ▼
    RegistryService.submit_report()
         │  (signs & sends Anchor instruction)
         ▼
    trust_registry program  →  AnalysisReport PDA  (permanent, public)

Usage example
-------------
    from services.registry_service import RegistryService
    from analyzers import RiskAnalyzer

    analyzer = RiskAnalyzer.with_default_rules()
    report   = analyzer.run(address=token_address, context=context_dict)

    registry = RegistryService()
    sig      = await registry.submit_report(report, report_hash_hex)
    print(f"Recorded on-chain: {sig}")
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from dataclasses import asdict
from typing import Any

from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solders.instruction import AccountMeta, Instruction
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction

from analyzers.base import RiskReport

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Program constants — must match the Rust program's declare_id! and seeds.
# ---------------------------------------------------------------------------

# Replace with the actual program ID after `anchor build && anchor deploy`
TRUST_REGISTRY_PROGRAM_ID = Pubkey.from_string(
    os.getenv("TRUST_REGISTRY_PROGRAM_ID", "CyphQT2vMp4UNGy9P7TFMqT6CybNGKFsTFHr6V9XXXXX")
)

ANALYSIS_SEED = b"analysis"

# Severity mapping — mirrors the Rust `severity` module constants.
_SEVERITY_MAP: dict[str, int] = {
    "BAJO":     0,
    "MEDIO":    1,
    "CRÍTICO":  2,
    "CRITICO":  2,  # ASCII fallback
}


# ---------------------------------------------------------------------------
# Anchor discriminator helper
# ---------------------------------------------------------------------------

def _anchor_discriminator(namespace: str, name: str) -> bytes:
    """
    Compute the 8-byte Anchor instruction discriminator.

    Anchor uses sha256("<namespace>:<name>")[0:8] to tag each instruction.
    This avoids instruction confusion attacks between different programs.

    References
    ----------
    https://www.anchor-lang.com/docs/the-program-module#instruction-discriminator
    """
    raw = f"{namespace}:{name}".encode()
    return hashlib.sha256(raw).digest()[:8]


DISCRIMINATOR_INIT   = _anchor_discriminator("global", "initialize_report")
DISCRIMINATOR_UPDATE = _anchor_discriminator("global", "update_report")


# ---------------------------------------------------------------------------
# RegistryService
# ---------------------------------------------------------------------------

class RegistryService:
    """
    Submits analysis results to the on-chain Trust Registry.

    Parameters
    ----------
    rpc_url : str | None
        Solana RPC endpoint.  Defaults to SOLANA_RPC_URL env var or devnet.
    inspector_keypair : Keypair | None
        The authority wallet that signs registry transactions.
        Defaults to loading the keypair from INSPECTOR_KEYPAIR_PATH env var.
    """

    def __init__(
        self,
        rpc_url: str | None = None,
        inspector_keypair: Keypair | None = None,
    ) -> None:
        self.rpc_url = rpc_url or os.getenv(
            "SOLANA_RPC_URL", "https://api.devnet.solana.com"
        )
        self.client = AsyncClient(self.rpc_url, commitment=Confirmed)
        self.inspector = inspector_keypair or self._load_keypair()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def submit_report(
        self,
        report: RiskReport,
        full_report_json: dict[str, Any] | None = None,
    ) -> str:
        """
        Determine whether to `initialize_report` or `update_report` on-chain,
        then build, sign, and send the Anchor instruction.

        Parameters
        ----------
        report : RiskReport
            The result from RiskAnalyzer.run().
        full_report_json : dict | None
            The complete report dict (including AI summary) whose SHA-256
            will be stored in `report_hash`.  If None, hashes the RiskReport
            dataclass fields instead.

        Returns
        -------
        str
            The transaction signature (base58) for the submitted instruction.
        """
        target_pubkey = Pubkey.from_string(report.address)
        pda, _bump   = self._derive_pda(target_pubkey)

        # Compute report_hash from the full JSON (or a compact representation)
        report_hash = self._compute_report_hash(report, full_report_json)

        # Check if a PDA already exists for this target
        account_info = await self.client.get_account_info(pda)
        pda_exists   = account_info.value is not None

        if pda_exists:
            logger.info("PDA exists — calling update_report for %s", report.address)
            ix = self._build_update_ix(target_pubkey, pda, report, report_hash)
        else:
            logger.info("New PDA — calling initialize_report for %s", report.address)
            ix = self._build_initialize_ix(target_pubkey, pda, report, report_hash)

        sig = await self._send_instruction(ix)
        logger.info("Trust Registry tx confirmed: %s", sig)
        return sig

    def derive_pda_address(self, target_address: str) -> str:
        """
        Return the canonical PDA string for a given target address.
        Useful for the frontend to display a link to the on-chain record.
        """
        pda, _ = self._derive_pda(Pubkey.from_string(target_address))
        return str(pda)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _derive_pda(self, target: Pubkey) -> tuple[Pubkey, int]:
        """Derive the PDA using the same seeds as the Rust program."""
        return Pubkey.find_program_address(
            [ANALYSIS_SEED, bytes(target)],
            TRUST_REGISTRY_PROGRAM_ID,
        )

    @staticmethod
    def _compute_report_hash(
        report: RiskReport,
        full_json: dict[str, Any] | None,
    ) -> bytes:
        """
        Produce a 32-byte SHA-256 digest to store in report_hash.

        Priority: full_json > compact RiskReport representation.
        """
        if full_json is not None:
            payload = json.dumps(full_json, sort_keys=True, ensure_ascii=False)
        else:
            payload = json.dumps(
                {
                    "address": report.address,
                    "score":   report.score,
                    "severity": report.severity,
                    "flags": [
                        {"rule": f.rule_name, "desc": f.description, "sev": f.severity}
                        for f in report.flags
                    ],
                },
                sort_keys=True,
            )
        return hashlib.sha256(payload.encode()).digest()

    def _build_initialize_ix(
        self,
        target: Pubkey,
        pda: Pubkey,
        report: RiskReport,
        report_hash: bytes,
    ) -> Instruction:
        """Encode the `initialize_report` Anchor instruction."""
        return self._build_instruction(
            discriminator=DISCRIMINATOR_INIT,
            target=target,
            pda=pda,
            report=report,
            report_hash=report_hash,
            include_system_program=True,
        )

    def _build_update_ix(
        self,
        target: Pubkey,
        pda: Pubkey,
        report: RiskReport,
        report_hash: bytes,
    ) -> Instruction:
        """Encode the `update_report` Anchor instruction."""
        return self._build_instruction(
            discriminator=DISCRIMINATOR_UPDATE,
            target=target,
            pda=pda,
            report=report,
            report_hash=report_hash,
            include_system_program=False,
        )

    def _build_instruction(
        self,
        *,
        discriminator: bytes,
        target: Pubkey,
        pda: Pubkey,
        report: RiskReport,
        report_hash: bytes,
        include_system_program: bool,
    ) -> Instruction:
        """
        Manually ABI-encode an Anchor instruction.

        Anchor's instruction layout:
          [8 bytes discriminator]
          [1 byte  risk_score   ]
          [1 byte  severity     ]
          [1 byte  flags_count  ]
          [32 bytes report_hash ]

        Note: for production use, generate the Python client from the IDL:
          `anchor idl fetch <program_id> | anchor-client-gen ...`
        """
        severity_byte = _SEVERITY_MAP.get(report.severity.upper(), 0)
        flags_count   = len(report.flags) & 0xFF  # clamp to u8

        data = (
            discriminator
            + bytes([report.score])
            + bytes([severity_byte])
            + bytes([flags_count])
            + report_hash  # 32 bytes
        )

        accounts = [
            AccountMeta(pubkey=target, is_signer=False, is_writable=False),
            AccountMeta(pubkey=self.inspector.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=pda, is_signer=False, is_writable=True),
        ]
        if include_system_program:
            accounts.append(
                AccountMeta(
                    pubkey=Pubkey.from_string("11111111111111111111111111111111"),
                    is_signer=False,
                    is_writable=False,
                )
            )

        return Instruction(
            program_id=TRUST_REGISTRY_PROGRAM_ID,
            accounts=accounts,
            data=data,
        )

    async def _send_instruction(self, ix: Instruction) -> str:
        """Sign and send a single instruction, returning the tx signature."""
        blockhash_resp = await self.client.get_latest_blockhash()
        blockhash      = blockhash_resp.value.blockhash

        tx = Transaction.new_signed_with_payer(
            instructions=[ix],
            payer=self.inspector.pubkey(),
            signing_keypairs=[self.inspector],
            recent_blockhash=blockhash,
        )
        resp = await self.client.send_transaction(tx)
        return str(resp.value)

    @staticmethod
    def _load_keypair() -> Keypair:
        """
        Load the inspector keypair from the path in INSPECTOR_KEYPAIR_PATH.

        Falls back to generating an ephemeral keypair for local dev/testing.
        NEVER use a generated keypair in production — funds will be lost.
        """
        path = os.getenv("INSPECTOR_KEYPAIR_PATH")
        if path and os.path.exists(path):
            with open(path, "r") as f:
                import json as _json
                secret = bytes(_json.load(f))
                return Keypair.from_bytes(secret)

        logger.warning(
            "INSPECTOR_KEYPAIR_PATH not set. Using ephemeral keypair — "
            "DO NOT use in production."
        )
        return Keypair()
