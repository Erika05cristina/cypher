def decode_token_mint(data: bytes):
    """Decodifica el layout de un SPL Token Mint (82 bytes)."""
    # En Solana, la info de un token tiene una estructura fija (c struct).
    # Byte 0-3: COption (Mint Authority) -> 1 si existe
    # Byte 4-35: Mint Authority Pubkey
    # Byte 36-43: Supply
    # Byte 44: Decimals
    # Byte 45: Is_initialized
    # Byte 46-49: COption (Freeze Authority) -> 1 si existe
    
    if len(data) < 82:
        return {"error": "Invalid Mint data length"}

    has_mint_authority = data[0] == 1
    has_freeze_authority = data[46] == 1  # CORREGIDO: el offset correcto es el byte 46
    
    return {
        "mint_authority_enabled": has_mint_authority,
        "freeze_authority_enabled": has_freeze_authority,
        "is_initialized": data[45] == 1
    }