import base64
from solana.rpc.api import Client
from solders.transaction import Transaction
import os

class SimulationService:
    def __init__(self):
        # Usamos la RPC de Mainnet por defecto para analizar tokens reales
        self.rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        self.client = Client(self.rpc_url)

    def simulate_tx(self, tx_base64: str):
        try:
            raw_tx = base64.b64decode(tx_base64)
            tx = Transaction.from_bytes(raw_tx)
            sim_result = self.client.simulate_transaction(tx)
            
            val = sim_result.value
            return {
                "success": val.err is None,
                "logs": val.logs if val.logs else [],
                "error": str(val.err) if val.err else None
            }
        except Exception as e:
            return {"success": False, "error": str(e)}