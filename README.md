<div align="center">

# 🔐 Cypher
### Forensic Auditing System for the Solana Ecosystem
*Dev3Pack Hackathon - Risk Intelligence Tool*

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-9945FF?style=flat-square&logo=solana&logoColor=white)](https://anchor-lang.com)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=white)](https://solana.com)

</div>

---

## 📍 Deployment Addresses

| Contract | Network | Address |
|---|---|---|
| **Trust Registry** (Anchor) | **Devnet** | [`HQtLF8KAA5B2iRXgr1Pjdb7DEFiWPWVrp1UXQrhKm5o1`](https://explorer.solana.com/address/HQtLF8KAA5B2iRXgr1Pjdb7DEFiWPWVrp1UXQrhKm5o1?cluster=devnet) |

> Verified on Solana Explorer - Block 461,230,688 ✅ Executable ✅ Upgradeable

---

## ❓ What is Cypher?

Cypher is an **on-chain risk intelligence tool** that analyzes tokens and smart contracts on the Solana blockchain to detect scam signals before a user invests. It combines three layers of security:

1. **Deterministic Analysis** - Risk rules that read raw blockchain data (mint authority, freeze authority, supply concentration).
2. **Transaction Simulation** - Executes buys/sells in simulation mode to detect honeypots before spending a cent.
3. **Immutable On-Chain Registry** - Results are recorded into an Anchor Smart Contract on Solana, creating a public audit history that no one can manipulate.

---


## 🏗️ General Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CYPHER SYSTEM                                        │
│                                                                             │
│  ┌───────────────┐    ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │   Frontend    │    │      Backend (FastAPI)  │  │   AI Engine (Groq)  │  │
│  │  React + TW   │───▶│                         │─▶│   Llama-3.1-8b      │  │
│  │  :5173        │    │  POST /analyze          │  │   Explain findings  │  │
│  └───────────────┘    │       │                 │  └─────────────────────┘  │
│                       │       ▼                 │                           │
│                       │  ┌───────────────────┐  │                           │
│                       │  │   Risk Engine     │  │                           │
│                       │  │ - Rules Engine    │  │                           │
│                       │  │ - RPC Simulator   │  │                           │
│                       │  └───────────────────┘  │                           │
│                       │       │                 │                           │
│                       └───────┼─────────────────┘                           │
│                               │                                             │
│                               ▼                                             │
│                     ┌────────────────────┐                                  │
│                     │  Trust Registry    │                                  │
│                     │  Anchor Smart      │                                  │
│                     │  Contract (Devnet) │                                  │
│                     └────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🧠 Module 1 — The Risk Engine (`backend/analyzers/`)

The core of Cypher. It evaluates tokens using a scoring system from 0 to 100.
Any score `>= 35` is classified as `CRITICAL`.

### Active Rules

1. `MintAuthorityRule`: Checks if the creator can mint unlimited tokens (Rug-pull vector). **Penalty: +45 pts**
2. `FreezeAuthorityRule`: Checks if the creator can freeze user wallets (Honeypot vector). **Penalty: +35 pts**
3. `SimulationSuccessRule`: Simulates a transaction. If the RPC node returns a pre-flight error, the contract is likely malicious. **Penalty: +20 pts**
4. `SupplyConcentrationRule`: Analyzes the largest holders. If a single entity holds > 50% of the supply, it's highly risky. **Penalty: +25 pts**

---

## ⛓️ Module 2 — Trust Registry Smart Contract (`contracts/trust_registry`)

Cypher is not a "black box" Web2 backend. The results of the audits are pushed directly to the Solana blockchain.

We use **PDAs (Program Derived Addresses)** to ensure that exactly *one* audit report exists per token.

### Data Structure

```rust
#[account]
pub struct AnalysisReport {
    pub target: Pubkey,        // 32 bytes
    pub inspector: Pubkey,     // 32 bytes
    pub report_hash: [u8; 32], // 32 bytes
    pub risk_score: u8,        // 1 byte
    pub severity: u8,          // 1 byte
    pub flags_count: u8,       // 1 byte
    pub timestamp: i64,        // 8 bytes
    pub bump: u8,              // 1 byte
}
```

### PDAs — Why they are the key

```text
Seeds: ["analysis", token_address]
                │
                ▼
       Deterministic PDA Address

Example: token BONK   --> PDA 0xABCD...
         token RAY    --> PDA 0xEF12...
         token XYZ    --> PDA 0x3456...
```

Each token has exactly **one** canonical PDA. The frontend can derive it client-side without calling the backend.

### Contract Security

```rust
// Only the original inspector can modify it — Anchor validates this automatically
#[account(
    mut,
    has_one = inspector @ CypherError::Unauthorized,
    seeds   = [ANALYSIS_SEED, target.key().as_ref()],
    bump    = report.bump,
)]
pub report: Account<'info, AnalysisReport>,
```

- `has_one = inspector` → If anyone else tries to sign, the transaction fails before executing code.
- `risk_score <= 100` → Validated on-chain; the backend cannot send corrupted data.
- `severity <= 2` → Only 3 severity levels are accepted.

---

## 🌐 Module 3 — API (`backend/main.py`)

Main endpoint that orchestrates the entire flow:

```json
POST /analyze
{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
}
```

Response:

```json
{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "score": 45,
  "severity": "MEDIUM",
  "flags": [
    {
      "rule": "MintAuthorityRule",
      "description": "Mint Authority is active: the creator can mint unlimited tokens...",
      "severity": 45
    }
  ],
  "simulation": null,
  "ai_provider": "groq",
  "ai_explanation": "**Summary**: The analyzed token presents a medium risk..."
}
```

---

## 🚀 Setup & Local Execution

### Prerequisites

- Python 3.12+
- Node.js 20+
- Rust + Cargo (only for the contract)
- Anchor CLI 0.30.1 (only for the contract)

### 1. Backend

```bash
cd backend

# Create virtual environment and install dependencies
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # Linux/Mac

pip install fastapi uvicorn python-dotenv solana solders groq google-generativeai

# Configure environment variables
cp .env.example .env
# Edit .env with your RPC URL and API Keys

# Run
python main.py
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
# UI available at http://localhost:5173
```

### 3. Smart Contract (requires Anchor CLI)

```bash
cd contracts/trust_registry

# Build
anchor build

# Get generated Program ID
solana address -k target/deploy/trust_registry-keypair.json
# Copy this ID and update declare_id!("...") in src/lib.rs

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID> --url devnet
```

---

## ⚙️ Environment Variables

Create a `.env` file in `backend/`:

```env
# Solana RPC Node URL
# Free Devnet:
SOLANA_RPC_URL=https://api.devnet.solana.com

# Trust Registry Program ID
TRUST_REGISTRY_PROGRAM_ID=HQtLF8KAA5B2iRXgr1Pjdb7DEFiWPWVrp1UXQrhKm5o1

# Inspector Keypair Path (Backend wallet)
INSPECTOR_KEYPAIR_PATH=C:/Users/TU_USUARIO/.config/solana/id.json

# AI Providers
GROQ_API_KEY=gsk_...
GOOGLE_API_KEY=AIza...
```

---

## 🗺️ Roadmap

- [x] Risk Engine with 4 rules + scoring
- [x] Transaction Simulation
- [x] Trust Registry Smart Contract (Anchor)
- [x] Python -> Smart Contract Integration
- [x] UI/UX Redesign (Bento Grid & Glassmorphism)
- [x] LLM Integration (Groq Llama-3 / Gemini)
- [ ] Real-time audit dashboard indexed by Helius
- [ ] Rule: detect "ownership renounced"
- [ ] Rule: locked liquidity analysis (burned LP tokens)
- [ ] Browser extension for real-time alerts

---

## 💡 Why Cypher Matters

The Solana ecosystem loses **millions of dollars** monthly to rug-pulls and honeypots. Current tools are:
- **Reactive** - They warn you *after* you lost money.
- **Centralized** - You must trust the provider is telling the truth.
- **Opaque** - They don't explain *why* something is dangerous.

Cypher is **proactive** (analyzes before you invest), **decentralized** (reports live on-chain), and **explainable** (AI translates technical findings into plain English).

---

<div align="center">

Built with 💻 & ☕ for the **Dev3Pack** Hackathon

*"Don't trust. Verify. Cypher."*

</div>
