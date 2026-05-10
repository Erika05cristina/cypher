"""
services/simulation_service.py
--------------------------------
Simulates a token transfer transaction against the Solana RPC to detect
hidden restrictions (honeypots, freeze authority traps, blacklists, etc.)
WITHOUT sending any real transaction or spending any funds.

Two modes:
  1. auto_simulate(token_mint_address)  ← builds & simulates internally (used in /analyze)
  2. simulate_tx(tx_base64)            ← simulates a raw tx provided externally
"""

import base64
import os
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.message import Message
from solders.instruction import Instruction, AccountMeta
from solders.keypair import Keypair
from solders.hash import Hash


# SPL Token program ID (constant on all Solana networks)
SPL_TOKEN_PROGRAM = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

# System program ID
SYSTEM_PROGRAM = Pubkey.from_string("11111111111111111111111111111112")

# Transfer instruction discriminator for SPL Token
TOKEN_TRANSFER_IX = 3   # instruction index 3 = Transfer


class SimulationService:
    def __init__(self):
        self.rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        self.client = Client(self.rpc_url)

    # ------------------------------------------------------------------
    # Public: auto-simulate a token — builds a minimal transfer tx
    # ------------------------------------------------------------------
    def auto_simulate(self, token_mint: str) -> dict:
        """
        Builds a synthetic SPL token transfer instruction for `token_mint`
        and simulates it via the RPC simulateTransaction endpoint.

        This is a READ-ONLY simulation: no keypair signs, no lamports spent,
        no state is modified.  We use a throw-away keypair as the signer so
        the simulation can run even without a funded wallet.
        """
        try:
            # Throw-away keypair (no funds needed for simulation)
            payer = Keypair()

            mint_pubkey = Pubkey.from_string(token_mint)

            # We'll use the payer's address as both source and destination
            # (simulate sending 0 tokens to self).  The point is to exercise
            # any transfer hook, blacklist check or freeze guard inside the contract.
            fake_ata = payer.pubkey()

            # Build a minimal SPL Transfer instruction (transfer 0 tokens)
            # Data layout: [instruction_index (1 byte), amount (8 bytes LE)]
            amount = (0).to_bytes(8, "little")
            data = bytes([TOKEN_TRANSFER_IX]) + amount

            accounts = [
                AccountMeta(pubkey=fake_ata,      is_signer=False, is_writable=True),
                AccountMeta(pubkey=mint_pubkey,   is_signer=False, is_writable=False),
                AccountMeta(pubkey=fake_ata,      is_signer=False, is_writable=True),
                AccountMeta(pubkey=payer.pubkey(), is_signer=True,  is_writable=False),
            ]

            ix = Instruction(
                program_id=SPL_TOKEN_PROGRAM,
                accounts=accounts,
                data=data,
            )

            # Fetch a recent blockhash (required to build a valid message)
            blockhash_resp = self.client.get_latest_blockhash()
            recent_blockhash: Hash = blockhash_resp.value.blockhash

            msg = Message.new_with_blockhash(
                instructions=[ix],
                payer=payer.pubkey(),
                blockhash=recent_blockhash,
            )

            tx = Transaction.new_unsigned(msg)

            sim_result = self.client.simulate_transaction(tx)
            val = sim_result.value

            # Classify outcome
            success = val.err is None
            logs    = list(val.logs) if val.logs else []
            error   = str(val.err) if val.err else None

            # Heuristic: look for honeypot signals in logs even on "success"
            honeypot_keywords = ["custom program error", "blacklist", "frozen", "insufficient funds", "0x1"]
            honeypot_signals  = [l for l in logs if any(k in l.lower() for k in honeypot_keywords)]
            if honeypot_signals and success:
                # Demote to warning — suspicious logs despite no hard error
                return {
                    "success": False,
                    "error": "Suspicious logs detected: " + "; ".join(honeypot_signals[:3]),
                    "logs": logs,
                    "mode": "auto",
                }

            return {
                "success": success,
                "error": error,
                "logs": logs,
                "mode": "auto",
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "logs": [],
                "mode": "auto",
            }

    # ------------------------------------------------------------------
    # Public: simulate an externally-provided raw transaction (base64)
    # ------------------------------------------------------------------
    def simulate_tx(self, tx_base64: str) -> dict:
        try:
            raw_tx = base64.b64decode(tx_base64)
            tx = Transaction.from_bytes(raw_tx)
            sim_result = self.client.simulate_transaction(tx)
            val = sim_result.value
            return {
                "success": val.err is None,
                "logs": list(val.logs) if val.logs else [],
                "error": str(val.err) if val.err else None,
                "mode": "manual",
            }
        except Exception as e:
            return {"success": False, "error": str(e), "logs": [], "mode": "manual"}