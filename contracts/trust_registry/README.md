# Trust Registry — Anchor Program

## Estructura de archivos

```
contracts/trust_registry/
├── Cargo.toml          ← Dependencias Rust/Anchor
└── src/
    └── lib.rs          ← Programa completo
```

## Comandos de despliegue

```bash
# 1. Instalar Anchor CLI (si no está instalado)
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# 2. Compilar
cd contracts/trust_registry
anchor build

# 3. El Program ID se genera en:
#    target/deploy/trust_registry-keypair.json
#    Reemplaza el declare_id!("...") en lib.rs con el ID real:
solana address -k target/deploy/trust_registry-keypair.json

# 4. Desplegar en devnet
anchor deploy --provider.cluster devnet

# 5. Verificar
solana program show <PROGRAM_ID> --url devnet
```

## Variables de entorno requeridas (backend)

```env
TRUST_REGISTRY_PROGRAM_ID=<program_id_del_paso_3>
INSPECTOR_KEYPAIR_PATH=~/.config/solana/id.json
SOLANA_RPC_URL=https://api.devnet.solana.com
```
