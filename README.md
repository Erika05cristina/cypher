<div align="center">

# 🔐 Cypher
### Sistema de Auditoría Forense para el Ecosistema Solana
*Hackathon Dev3Pack — Risk Intelligence Tool*

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-9945FF?style=flat-square&logo=solana&logoColor=white)](https://anchor-lang.com)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=white)](https://solana.com)

</div>

---

## 🚀 Deployment Addresses

| Contract | Network | Address |
|---|---|---|
| **Trust Registry** (Anchor) | **Devnet** | [`HQtLF8KAA5B2iRXgr1Pjdb7DEFiWPWVrp1UXQrhKm5o1`](https://explorer.solana.com/address/HQtLF8KAA5B2iRXgr1Pjdb7DEFiWPWVrp1UXQrhKm5o1?cluster=devnet) |

> Verified on Solana Explorer — Block 461,230,688 · Executable · Upgradeable

---

## ¿Qué es Cypher?

Cypher es una herramienta de **inteligencia de riesgos on-chain** que analiza tokens y contratos en la blockchain de Solana para detectar señales de estafa antes de que el usuario invierta. Combina tres capas de seguridad:

1. **Análisis determinístico** — Reglas de riesgo que leen datos reales de la blockchain (mint authority, freeze authority, concentración de supply).
2. **Simulación de transacciones** — Ejecuta la compra/venta en modo simulado para detectar honeypots antes de gastar un centavo.
3. **Registro inmutable on-chain** — Los resultados se graban en un Smart Contract en Solana, creando un historial público de auditorías que nadie puede manipular.

---


## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        CYPHER SYSTEM                            │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────────────────────────┐  │
│  │   Frontend   │    │            Backend (FastAPI)          │  │
│  │  React + TW  │───▶│                                      │  │
│  │  :5173       │    │  POST /analyze                       │  │
│  └──────────────┘    │       │                              │  │
│                       │       ▼                              │  │
│                       │  ┌─────────────┐                    │  │
│                       │  │ RiskAnalyzer│ ← Inyección de     │  │
│                       │  │ (Python)    │   Dependencias     │  │
│                       │  └──────┬──────┘                    │  │
│                       │         │ ejecuta 4 reglas          │  │
│                       │         ▼                           │  │
│                       │  ┌─────────────────────────┐        │  │
│                       │  │  MintAuthorityRule  +45  │        │  │
│                       │  │  FreezeAuthorityRule +35  │        │  │
│                       │  │  SimulationSuccess  +20  │        │  │
│                       │  │  SupplyConcentration+25  │        │  │
│                       │  └──────────────────────────┘        │  │
│                       │         │ RiskReport                 │  │
│                       │         ▼                           │  │
│                       │  ┌──────────────┐                   │  │
│                       │  │RegistryService│──────────────────┼──┼──▶
│                       │  └──────────────┘   firma tx        │  │
│                       └──────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Solana Blockchain                            │   │
│  │                                                          │   │
│  │  trust_registry (Anchor/Rust)                            │   │
│  │  PDA: ["analysis", target_pubkey]                        │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ target · inspector · report_hash · risk_score    │    │   │
│  │  │ severity · flags_count · timestamp · bump        │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
cypher/
│
├── backend/                        ← API + Motor de riesgo (Python)
│   ├── main.py                     ← FastAPI: endpoints, CORS, orquestación
│   ├── .env                        ← Variables de entorno (no se sube a git)
│   │
│   ├── analyzers/                  ← 🧠 Motor de riesgo (núcleo del sistema)
│   │   ├── __init__.py             ← API pública del paquete
│   │   ├── base.py                 ← Abstracciones: RiskRule, RiskFlag, RiskReport
│   │   ├── rules.py                ← 4 reglas concretas de seguridad
│   │   └── risk_analyzer.py        ← Orquestador + generador de prompt IA
│   │
│   ├── services/
│   │   ├── simulation_service.py   ← Simula transacciones vía RPC de Solana
│   │   └── registry_service.py     ← Envía resultados al Smart Contract
│   │
│   ├── utils/
│   │   └── solana_utils.py         ← Decodifica layout binario del SPL Token Mint
│   │
│   └── tests/
│       └── test_risk_engine.py     ← 21 tests unitarios (sin RPC, 0 mocks)
│
├── contracts/                      ← 📜 Smart Contract (Rust + Anchor)
│   └── trust_registry/
│       ├── Cargo.toml              ← Dependencias Rust
│       └── src/
│           └── lib.rs              ← Programa Anchor completo
│
└── frontend/                       ← 🖥 Interfaz de usuario (React + Tailwind v4)
    ├── src/
    │   ├── App.jsx                 ← Componente principal
    │   ├── App.css                 ← Estilos de la aplicación
    │   └── index.css               ← Estilos globales + Tailwind
    ├── postcss.config.js           ← PostCSS con @tailwindcss/postcss
    ├── tailwind.config.js          ← Configuración de Tailwind v4
    └── vite.config.js              ← Configuración de Vite
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|---|---|---|---|
| **API** | FastAPI | 0.115+ | Endpoints REST, validación con Pydantic |
| **Blockchain** | solana-py + solders | latest | RPC calls, firmar transacciones |
| **Smart Contract** | Anchor (Rust) | 0.30.1 | Trust Registry on-chain |
| **Frontend** | React + Vite | 19 / 8 | Interfaz de usuario |
| **CSS** | Tailwind CSS | 4.3 | Estilos utilitarios |
| **Runtime** | Python | 3.12+ | Backend |
| **Tests** | pytest | 9+ | Suite de tests unitarios |

---

## Módulo 1 — Risk Engine (`backend/analyzers/`)

El núcleo del sistema. Analiza cualquier token de Solana aplicando reglas de seguridad de forma independiente y acumulando un score de riesgo.

### Cómo funciona

```python
from analyzers import RiskAnalyzer

analyzer = RiskAnalyzer.with_default_rules()

report = analyzer.run(
    address="So11111111111111111111111111111111111111112",
    context={
        "mint_authority_enabled":   True,   # obtenido del RPC
        "freeze_authority_enabled": False,
        "simulation_success":       True,
        "top_holder_pct":           91.0,   # opcional
    }
)

print(report.score)     # 70
print(report.severity)  # CRÍTICO
print(report.flags)     # [MintAuthorityRule, SupplyConcentrationRule]

# Genera el prompt listo para enviar a OpenAI / Claude / Gemini
prompt = analyzer.build_ai_prompt(report)
```

### Las 4 Reglas de Seguridad

| Regla | Severidad | ¿Qué detecta? | ¿Por qué es peligroso? |
|---|:---:|---|---|
| `MintAuthorityRule` | **+45** | Mint authority no revocada | El creador puede imprimir tokens ilimitados y colapsar el precio (rug-pull clásico) |
| `FreezeAuthorityRule` | **+35** | Freeze authority activa | Pueden congelar tu cuenta y que nunca puedas vender (honeypot) |
| `SimulationSuccessRule` | **+20** | Simulación de TX fallida | La venta revertirá on-chain; hay restricciones ocultas de transferencia |
| `SupplyConcentrationRule` | **+25** | >80% del supply en 1 wallet | Un dump coordinado puede colapsar el precio en segundos |

### Niveles de Severidad

```
Score  0 – 25  →  🟢 BAJO      Parece seguro, investiga más
Score 26 – 60  →  🟡 MEDIO     Procede con cautela
Score 61 – 100 →  🔴 CRÍTICO   No inviertas
```

### Principios de diseño aplicados

- **Open/Closed Principle** — Añadir una regla nueva = crear una clase en `rules.py` y registrarla en `with_default_rules()`. Ningún otro archivo cambia.
- **Inyección de Dependencias** — `RiskAnalyzer(rules=[...])` acepta cualquier lista de reglas; ideal para tests que solo prueban 1 regla.
- **Defensivo por defecto** — Si un campo no está en el `context`, la regla devuelve `None` silenciosamente. Nunca rompe la ejecución.

---

## Módulo 2 — Smart Contract (`contracts/trust_registry/`)

Un programa Anchor en Solana que actúa como un **Registro de Confianza inmutable**. Una vez que Cypher analiza un token, graba el resultado permanentemente en la blockchain.

### ¿Por qué on-chain?

Un backend centralizado puede mentir o ser hackeado. Un PDA de Solana no:

- **Nadie controla la clave privada del PDA** — Solo el programa puede escribir en él.
- **Cualquiera puede leerlo** — Sin confiar en el backend, sin API key, directo de la blockchain.
- **No se puede borrar** (si se deshabilita `close_report`) — El historial de auditorías es permanente.

### Cuenta `AnalysisReport` (116 bytes)

```
Offset  Bytes   Campo           Descripción
──────────────────────────────────────────────────────────────────
   0      8     discriminator   Tag único de Anchor (auto-gestionado)
   8     32     target          Dirección del token/contrato auditado
  40     32     inspector       Wallet del backend que firmó el análisis
  72     32     report_hash     SHA-256 del JSON completo (prueba de integridad)
 104      1     risk_score      Score 0-100 del Risk Engine
 105      1     severity        0=BAJO  1=MEDIO  2=CRÍTICO
 106      1     flags_count     Número de reglas que dispararon
 107      8     timestamp       Unix timestamp del análisis
 115      1     bump            Bump canónico del PDA (guardado para eficiencia)
```

### PDAs — Por qué son la pieza clave

```
Seeds: ["analysis", token_address]
                │
                ▼
       Dirección PDA determinística

Ejemplo: token BONK   → PDA 0xABCD...
         token RAY    → PDA 0xEF12...
         token XYZ    → PDA 0x3456...
```

Cada token tiene exactamente **un** PDA canónico. El frontend puede derivarlo
client-side sin llamar al backend:

```javascript
const [pda] = await PublicKey.findProgramAddress(
  [Buffer.from("analysis"), tokenMint.toBytes()],
  TRUST_REGISTRY_PROGRAM_ID
);
```

### Instrucciones del contrato

| Instrucción | ¿Quién puede llamarla? | Acción |
|---|---|---|
| `initialize_report` | Cualquier inspector | Crea el PDA por primera vez |
| `update_report` | Solo el inspector original | Actualiza el reporte existente |
| `close_report` | Solo el inspector original | Cierra la cuenta y recupera el SOL |

### Seguridad del contrato

```rust
// Solo el inspector original puede modificar — Anchor lo valida automáticamente
#[account(
    mut,
    has_one = inspector @ CypherError::Unauthorized,
    seeds   = [ANALYSIS_SEED, target.key().as_ref()],
    bump    = report.bump,
)]
pub report: Account<'info, AnalysisReport>,
```

- `has_one = inspector` → Si alguien más intenta firmar, la transacción falla antes de ejecutar código.
- `risk_score <= 100` → Validado on-chain; el backend no puede enviar datos corruptos.
- `severity <= 2` → Solo se aceptan los 3 niveles definidos.

---

## Módulo 3 — API (`backend/main.py`)

Endpoint principal que orquesta todo el flujo:

```
POST /analyze
{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "tx_base64": "AQA..."  ← opcional, para simular una compra/venta
}
```

Respuesta:

```json
{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "score": 45,
  "severity": "MEDIO",
  "flags": [
    {
      "rule": "MintAuthorityRule",
      "description": "Mint Authority activa: el creador puede emitir tokens...",
      "severity": 45
    }
  ],
  "simulation": null,
  "ai_prompt": "Eres Cypher, un asistente experto en seguridad...",
  "ai_summary": "Integra tu LLM: envía `ai_prompt` a tu modelo preferido."
}
```

> **Integración IA**: El campo `ai_prompt` es un prompt estructurado listo para enviar a OpenAI, Anthropic Claude, o Google Gemini. Tú provees la API key y la llamada al LLM.

---

## Setup y Ejecución Local

### Prerrequisitos

- Python 3.12+
- Node.js 20+
- Rust + Cargo (solo para el contrato)
- Anchor CLI 0.30.1 (solo para el contrato)

### 1. Backend

```bash
cd backend

# Crear entorno virtual e instalar dependencias
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # Linux/Mac

pip install fastapi uvicorn python-dotenv solana solders

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu RPC URL

# Ejecutar
python main.py
# API disponible en http://localhost:8000
# Docs interactivas en http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
# UI disponible en http://localhost:5173
```

### 3. Tests del Risk Engine

```bash
cd backend

# Instalar pytest (solo primera vez)
.\venv\Scripts\pip install pytest

# Ejecutar los 21 tests
.\venv\Scripts\python -m pytest tests/ -v
```

Resultado esperado:
```
21 passed in 0.13s ✅
```

### 4. Smart Contract (requiere Anchor CLI)

```bash
cd contracts/trust_registry

# Compilar
anchor build

# Obtener el Program ID generado
solana address -k target/deploy/trust_registry-keypair.json
# Copia este ID y actualiza declare_id!("...") en src/lib.rs

# Desplegar en devnet
anchor deploy --provider.cluster devnet

# Verificar despliegue
solana program show <PROGRAM_ID> --url devnet
```

---

## Variables de Entorno

Crea un archivo `.env` en `backend/`:

```env
# URL del nodo RPC de Solana
# Devnet gratuita:
SOLANA_RPC_URL=https://api.devnet.solana.com

# Para mainnet (Helius, QuickNode, Alchemy recomendados):
# SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=TU_KEY

# Program ID del Trust Registry (después de hacer anchor deploy)
TRUST_REGISTRY_PROGRAM_ID=CyphXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Path al keypair del inspector (wallet del backend)
INSPECTOR_KEYPAIR_PATH=C:/Users/TU_USUARIO/.config/solana/id.json
```

---

## Flujo Completo de Auditoría

```
Usuario ingresa dirección de token
              │
              ▼
    POST /analyze (FastAPI)
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
Fetch on-chain      Simular TX
(solana RPC)        (si se provee)
    │                    │
    └─────────┬──────────┘
              │
              ▼
      RiskAnalyzer.run()
      ┌─────────────────────────┐
      │ MintAuthorityRule    ✓? │
      │ FreezeAuthorityRule  ✓? │
      │ SimulationSuccess    ✓? │
      │ SupplyConcentration  ✓? │
      └────────────┬────────────┘
                   │
                   ▼
             RiskReport
          score=70, severity=CRÍTICO
          flags=[MintAuthority, Supply]
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  build_ai_prompt()    RegistryService
  (prompt para LLM)   .submit_report()
        │                     │
        ▼                     ▼
  → Enviar a tu LLM    AnalysisReport PDA
  → Respuesta en       grabado en Solana
    lenguaje natural   (inmutable, público)
```

---

## Roadmap

- [x] Risk Engine con 4 reglas + score
- [x] Simulación de transacciones
- [x] Smart Contract Trust Registry (Anchor)
- [x] Integración Python → Smart Contract
- [x] Suite de tests unitarios (21 tests)
- [ ] Integración con LLM (OpenAI / Claude)
- [ ] Dashboard de auditorías indexado por Helius
- [ ] Regla: detección de ownership renounced
- [ ] Regla: análisis de liquidez bloqueada (LP tokens quemados)
- [ ] Extensión de navegador para alertas en tiempo real

---

## Por qué Cypher importa

El ecosistema Solana pierde **millones de dólares** mensualmente en rug-pulls y honeypots. Las herramientas actuales son:
- **Reactivas** — te avisan después de que perdiste el dinero.
- **Centralizadas** — confías en que el proveedor dice la verdad.
- **Opacas** — no explican _por qué_ algo es peligroso.

Cypher es **proactivo** (analiza antes de invertir), **descentralizado** (los reportes viven on-chain) y **explicable** (la IA traduce los hallazgos a lenguaje natural).

---

<div align="center">

Construido con ❤️ para el Hackathon **Dev3Pack**

*"No confíes. Verifica. Cypher."*

</div>
