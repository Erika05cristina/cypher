"""
services/ai_service.py
-----------------------
Servicio de IA multi-proveedor.
Ahora con soporte prioritario para Groq (Llama 3.1).
"""

from __future__ import annotations

import asyncio
import logging
import os

logger = logging.getLogger(__name__)


# ── Groq (Ultra rápido, recomendado para el hackathon) ───────────────────────

class GroqProvider:
    """
    Usa la API de Groq con el modelo Llama 3.1.
    Es extremadamente rápido y tiene buen tier gratuito.
    """

    _BASE = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def complete(self, prompt: str) -> str:
        import httpx

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 600,
            "temperature": 0.4,
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    self._BASE,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json=payload,
                )

            if resp.status_code == 429:
                return "⚠️ Groq: Rate limit exceeded. Please wait a moment."
            
            if resp.status_code in (400, 401, 403):
                return "⚠️ Invalid or expired Groq API key."

            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            return f"⚠️ Error contacting Groq: {e}"


# ── Fallback: Gemini (OpenAI compatible endpoint) ───────────────────────────

class GeminiProvider:
    _BASE = "https://generativelanguage.googleapis.com/v1beta/chat/completions"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def complete(self, prompt: str) -> str:
        import httpx

        payload = {
            "model": "gemini-2.0-flash",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 600,
            "temperature": 0.4,
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    self._BASE,
                    params={"key": self._api_key},
                    json=payload,
                )

            if resp.status_code == 429:
                return "⚠️ AI rate limit exceeded (429). Please wait a few seconds."
            
            if resp.status_code in (400, 401, 403):
                return "⚠️ Invalid or expired Gemini API key."

            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            return f"⚠️ Error contacting AI provider: {e}"


# ── OpenAI ────────────────────────────────────────────────────────────────────

class OpenAIProvider:
    def __init__(self, api_key: str) -> None:
        from openai import AsyncOpenAI
        self._client = AsyncOpenAI(api_key=api_key)

    async def complete(self, prompt: str) -> str:
        response = await self._client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.4,
        )
        return response.choices[0].message.content.strip()


# ── Fallback ──────────────────────────────────────────────────────────────────

class NoopProvider:
    async def complete(self, prompt: str) -> str:
        return (
            "🤖 AI not configured. Add GROQ_API_KEY or GOOGLE_API_KEY in your .env file "
            "and restart the backend."
        )


# ── AIService ─────────────────────────────────────────────────────────────────

class AIService:
    def __init__(self) -> None:
        self._provider, self._name = self._detect_provider()

    def _detect_provider(self):
        # 1. Intentar Groq primero (pedido por el usuario)
        if key := os.getenv("GROQ_API_KEY"):
            p = GroqProvider(key)
            logger.info("AI provider: Groq (llama-3.1-8b-instant)")
            return p, "Groq"

        # 2. Intentar Gemini
        if key := os.getenv("GOOGLE_API_KEY"):
            p = GeminiProvider(key)
            logger.info("AI provider: Gemini (via OpenAI proxy)")
            return p, "Gemini"

        # 3. Intentar OpenAI
        if key := os.getenv("OPENAI_API_KEY"):
            try:
                p = OpenAIProvider(key)
                logger.info("AI provider: OpenAI (gpt-4o-mini)")
                return p, "OpenAI"
            except ImportError:
                pass

        logger.warning("No AI provider configured. Using Noop.")
        return NoopProvider(), "Not configured"

    async def explain(self, prompt: str) -> str:
        try:
            return await self._provider.complete(prompt)
        except Exception as e:
            logger.error("Unexpected AI provider error: %s", e)
            return f"⚠️ Unexpected AI error: {e}"

    @property
    def provider_name(self) -> str:
        return self._name
