"""
analyzers/risk_analyzer.py
--------------------------
Orchestrator that wires rules together and produces a RiskReport.

Design decisions
----------------
• **Dependency Injection via constructor**: the caller passes the list of
  rules at instantiation time.  This means:
    - Unit tests can inject only the rules they care about.
    - New rules require zero changes to this class.
    - Rules can be conditionally included (e.g., feature flags).

• **Score capping**: individual rules can theoretically push the score above
  100.  We cap it so the UI can safely display it as a percentage.

• **Severity thresholds** (matches current main.py logic):
    BAJO     →  0 – 25
    MEDIO    → 26 – 60
    CRÍTICO  → 61 – 100
"""

from __future__ import annotations

import textwrap
from typing import Any, Sequence

from .base import RiskFlag, RiskReport, RiskRule


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

class RiskAnalyzer:
    """
    Runs a pluggable set of RiskRule implementations against on-chain context
    data and returns a unified RiskReport.

    Parameters
    ----------
    rules : Sequence[RiskRule]
        Ordered list of rules to execute.  Inject the default set via
        ``RiskAnalyzer.with_default_rules()`` or supply custom rules for tests.

    Example
    -------
    >>> from analyzers import RiskAnalyzer
    >>> analyzer = RiskAnalyzer.with_default_rules()
    >>> report = analyzer.run(
    ...     address="So11111111111111111111111111111111111111112",
    ...     context={"mint_authority_enabled": True, "freeze_authority_enabled": False},
    ... )
    >>> print(report.score, report.severity)
    45 MEDIO
    """

    def __init__(self, rules: Sequence[RiskRule]) -> None:
        self._rules = list(rules)

    # ------------------------------------------------------------------
    # Factory helpers
    # ------------------------------------------------------------------

    @classmethod
    def with_default_rules(cls) -> "RiskAnalyzer":
        """
        Convenience factory that returns an analyzer pre-loaded with all
        production rules in recommended execution order.
        """
        from .rules import (
            FreezeAuthorityRule,
            MintAuthorityRule,
            SimulationSuccessRule,
            SupplyConcentrationRule,
        )

        return cls(
            rules=[
                MintAuthorityRule(),       # highest severity first
                FreezeAuthorityRule(),
                SimulationSuccessRule(),
                SupplyConcentrationRule(),
            ]
        )

    # ------------------------------------------------------------------
    # Core analysis pipeline
    # ------------------------------------------------------------------

    def run(self, address: str, context: dict[str, Any]) -> RiskReport:
        """
        Execute every registered rule and aggregate the results.

        Parameters
        ----------
        address : str
            The Solana address being analysed (stored in the report for
            traceability).
        context : dict[str, Any]
            Flat dict of on-chain / simulation data.  Rules that need a key
            that is absent will silently skip (defensive pattern).

        Returns
        -------
        RiskReport
            Fully populated report ready for API serialisation or AI prompt
            generation.
        """
        flags: list[RiskFlag] = []
        cumulative_score: int = 0

        for rule in self._rules:
            flag = rule.check(context)
            if flag is not None:
                flags.append(flag)
                cumulative_score += flag.severity

        capped_score = min(cumulative_score, 100)
        severity = self._classify_severity(capped_score)

        return RiskReport(
            address=address,
            score=capped_score,
            severity=severity,
            flags=flags,
            raw_inputs=context,
        )

    # ------------------------------------------------------------------
    # AI prompt generation
    # ------------------------------------------------------------------

    def build_ai_prompt(self, report: RiskReport) -> str:
        """
        Convert a RiskReport into a structured prompt for an LLM.

        The prompt is written in a few-shot style so most LLMs (GPT-4,
        Claude, Gemini…) can return a consistent, user-friendly explanation
        without additional system-prompt tuning.

        Parameters
        ----------
        report : RiskReport
            The report returned by ``run()``.

        Returns
        -------
        str
            A ready-to-send prompt string.  Append it directly to your
            messages array or pass it as the ``user`` message.

        Usage example
        -------------
        >>> prompt = analyzer.build_ai_prompt(report)
        >>> response = openai_client.chat.completions.create(
        ...     model="gpt-4o",
        ...     messages=[{"role": "user", "content": prompt}],
        ... )
        """
        flags_block = self._format_flags_for_prompt(report.flags)

        prompt = textwrap.dedent(f"""
            Eres Cypher, un asistente experto en seguridad de tokens en la blockchain de Solana.
            Analiza el siguiente reporte de seguridad y explica los riesgos al usuario en español,
            de forma clara, concisa y sin tecnicismos innecesarios.

            === REPORTE DE SEGURIDAD ===
            Dirección analizada : {report.address}
            Score de riesgo     : {report.score} / 100
            Nivel de severidad  : {report.severity}

            === SEÑALES DETECTADAS ===
            {flags_block}

            === INSTRUCCIONES DE RESPUESTA ===
            1. Comienza con un resumen de UNA oración que indique si el token es peligroso o no.
            2. Explica cada señal detectada en un párrafo corto (máximo 3 oraciones).
            3. Termina con una recomendación de acción concreta para el usuario
               (ej: "No inviertas", "Procede con cautela", "Parece seguro pero investiga más").
            4. Usa emojis moderadamente para mejorar la legibilidad (🚨 para riesgos críticos,
               ⚠️ para advertencias, ✅ para aspectos limpios).
            5. NO uses lenguaje alarmista si el score es bajo.
            6. Responde SOLO con el análisis, sin saludos ni despedidas.
        """).strip()

        return prompt

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _classify_severity(score: int) -> str:
        """Map a numeric score to a human-readable severity label."""
        if score > 60:
            return "CRÍTICO"
        if score > 25:
            return "MEDIO"
        return "BAJO"

    @staticmethod
    def _format_flags_for_prompt(flags: list[RiskFlag]) -> str:
        """Render the flags list as a numbered, prompt-friendly string."""
        if not flags:
            return "✅ No se detectaron señales de riesgo."

        lines: list[str] = []
        for i, flag in enumerate(flags, start=1):
            lines.append(
                f"{i}. [{flag.rule_name}] (severidad +{flag.severity})\n"
                f"   {flag.description}"
            )
        return "\n".join(lines)
