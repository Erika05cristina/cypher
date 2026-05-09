import time
import json
from solders.keypair import Keypair
from solana.rpc.api import Client
from spl.token.client import Token
from spl.token.constants import TOKEN_PROGRAM_ID
from spl.token.instructions import AuthorityType

def main():
    print("Conectando a Devnet...")
    client = Client("https://api.devnet.solana.com")
    
    print("Cargando wallet...")
    with open("wallet-keypair.json", "r") as f:
        secret = json.load(f)
        payer = Keypair.from_bytes(bytes(secret))
        
    print(f"Payer: {payer.pubkey()}")
    
    print("1. Creando Token (sin Freeze Authority por defecto)...")
    try:
        token = Token.create_mint(
            conn=client,
            payer=payer,
            mint_authority=payer.pubkey(),
            decimals=9,
            program_id=TOKEN_PROGRAM_ID,
            freeze_authority=None
        )
        
        print("2. Renunciando al Mint Authority (para hacerlo 100% seguro)...")
        # En Solana, los tokens nacen con mint_authority, pero los buenos proyectos 
        # "queman" o renuncian a este permiso para no poder imprimir más.
        token.set_authority(
            account=token.pubkey,
            current_authority=payer,
            authority_type=AuthorityType.MINT_TOKENS,
            new_authority=None
        )
        
        print("\n=============================================")
        print("TOKEN TOTALMENTE SEGURO CREADO CON EXITO")
        print("=============================================")
        print(f"Direccion del token: {token.pubkey}")
        print("Copia esta direccion y pegala en Cypher.")
    except Exception as e:
        print(f"Error al crear el token: {e}")

if __name__ == "__main__":
    main()
