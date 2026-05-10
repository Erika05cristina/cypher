"""
backend/main.py
---------------
FastAPI entrypoint for the Cypher risk intelligence API.

The previous inline scoring logic has been replaced by the RiskAnalyzer,
which enforces the Open/Closed principle: new rules are added to analyzers/
without touching this file.
"""

from __future__ import annotations

import os
from dotenv import load_dotenv

# ⚠️ load_dotenv() MUST be called before importing any service module
# that reads env vars at module level (e.g. RegistryService reads
# TRUST_REGISTRY_PROGRAM_ID when the module is first imported).
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from solana.rpc.api import Client
from solders.pubkey import Pubkey

from analyzers import RiskAnalyzer
from services.simulation_service import SimulationService
from services.registry_service import RegistryService
from services.ai_service import AIService
from utils.solana_utils import decode_token_mint

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Cypher Risk Intelligence API",
    version="1.0.0",
    description="Solana token risk analysis engine with deterministic rules and AI explanations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Singletons (injected into route handlers)
# ---------------------------------------------------------------------------

solana_client = Client(os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"))
sim_service    = SimulationService()
risk_analyzer  = RiskAnalyzer.with_default_rules()  # ← all default rules loaded here
registry_service = RegistryService()                # ← wires Python to SolPG contract
ai_service     = AIService()                        # ← auto-detects Gemini/OpenAI/Anthropic


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    address: str
    tx_base64: str | None = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Analyse a Solana token address and return a structured risk report.

    Steps
    -----
    1. Fetch on-chain account data via RPC.
    2. Decode the SPL Token Mint layout to extract authority flags.
    3. Optionally simulate the provided transaction.
    4. Run all registered RiskRules through RiskAnalyzer.
    5. Generate an AI prompt from the RiskReport (LLM call not included here —
       the prompt is returned so the frontend or an async worker can submit it).
    """
    try:
        # --- 1. Fetch on-chain data -----------------------------------------
        print(f"\n[INFO] 🔍 Iniciando análisis para token: {request.address}")
        pubkey = Pubkey.from_string(request.address)
        acc_info = solana_client.get_account_info(pubkey)

        if acc_info.value:
            print("[INFO] ✅ Datos del token encontrados en la blockchain (Devnet).")
        else:
            print("[WARNING] ⚠️ Token NO encontrado en Devnet (Si es real, debe estar en Mainnet).")

        # --- 2. Build context dict for the risk engine ----------------------
        context: dict = {}

        if acc_info.value:
            mint_data = decode_token_mint(acc_info.value.data)
            context["mint_authority_enabled"] = mint_data.get("mint_authority_enabled", False)
            context["freeze_authority_enabled"] = mint_data.get("freeze_authority_enabled", False)

        print(f"[INFO] ⚙️ Contexto final extraído para el motor: {context}")


        # --- 3. Transaction simulation (auto — always runs) -----------------
        print(f"[INFO] 🧪 Running auto-simulation for {request.address}...")
        if request.tx_base64:
            # Manual mode: user provided a raw transaction
            sim_result = sim_service.simulate_tx(request.tx_base64)
        else:
            # Auto mode: backend builds & simulates a synthetic transfer tx
            sim_result = sim_service.auto_simulate(request.address)

        context["simulation_success"] = sim_result["success"]
        context["simulation_error"]   = sim_result.get("error")
        print(f"[INFO] 🧪 Simulation result: success={sim_result['success']}, error={sim_result.get('error')}")

        # --- 4. Run the Risk Engine -----------------------------------------
        report = risk_analyzer.run(address=request.address, context=context)

        # --- 5. Generar prompt y llamar al LLM --------------------------------
        ai_prompt       = risk_analyzer.build_ai_prompt(report)
        ai_explanation  = await ai_service.explain(ai_prompt)   # ← llamada real a la IA

        # --- 6. Guardar en la Blockchain (Trust Registry) -------------------
        tx_sig = None
        try:
            tx_sig = await registry_service.submit_report(report)
        except Exception as e:
            print(f"Error al guardar en blockchain: {e}")
            tx_sig = f"Error: {str(e)}"

        return {
            "address":        report.address,
            "score":          report.score,
            "severity":       report.severity,
            "flags": [
                {
                    "rule":        f.rule_name,
                    "description": f.description,
                    "severity":    f.severity,
                }
                for f in report.flags
            ],
            "simulation":     sim_result,
            "ai_explanation": ai_explanation,   # ← respuesta real del LLM en español
            "ai_prompt":      ai_prompt,         # ← prompt crudo (para debug/referencia)
            "ai_provider":    ai_service.provider_name,
            "tx_signature":   tx_sig,
        }


    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/health")
async def health():
    """Simple health-check endpoint."""
    return {"status": "ok", "engine": "RiskAnalyzer", "rules": 4}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)