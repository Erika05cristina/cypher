import time
import json
from solders.keypair import Keypair
from solana.rpc.api import Client
from spl.token.client import Token
from spl.token.constants import TOKEN_PROGRAM_ID

def main():
    print("Conectando a Devnet...")
    client = Client("https://api.devnet.solana.com")
    
    print("Cargando wallet...")
    with open("wallet-keypair.json", "r") as f:
        secret = json.load(f)
        payer = Keypair.from_bytes(bytes(secret))
        
    print(f"Payer: {payer.pubkey()}")
    
    print("Creando Token Malicioso (con Mint y Freeze Authority)...")
    try:
        token = Token.create_mint(
            conn=client,
            payer=payer,
            mint_authority=payer.pubkey(),
            decimals=9,
            program_id=TOKEN_PROGRAM_ID,
            freeze_authority=payer.pubkey()
        )
        print("\n=============================================")
        print("TOKEN MALICIOSO CREADO CON EXITO")
        print("=============================================")
        print(f"Direccion del token: {token.pubkey}")
        print("Copia esta direccion y pegala en Cypher.")
    except Exception as e:
        print(f"Error al crear el token: {e}")


if __name__ == "__main__":
    main()
