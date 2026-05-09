def decode_token_mint(data: bytes):
    """Decodifica el layout de un SPL Token Mint (82 bytes)."""
    # En Solana, la info de un token tiene una estructura fija.
    # El byte 0 indica si hay autoridad para imprimir más (Mint Authority).
    # El byte 44 indica si hay autoridad para congelar cuentas (Freeze Authority).
    
    if len(data) < 82:
        return {"error": "Invalid Mint data length"}

    has_mint_authority = data[0] == 1
    has_freeze_authority = data[44] == 1
    
    return {
        "mint_authority_enabled": has_mint_authority,
        "freeze_authority_enabled": has_freeze_authority,
        "is_initialized": data[45] == 1
    }