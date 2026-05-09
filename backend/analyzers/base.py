"""
analyzers/base.py
-----------------
Defines the abstract contract that every risk rule must fulfill.

Using abc.ABC + abstractmethod enforces the interface at class-definition
time, so adding a new rule that forgets to implement `check()` raises
a TypeError immediately — not at runtime during analysis.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Value object: a single flag raised by one rule
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RiskFlag:
    """Immutable record of a single security concern detected by a rule."""

    rule_name: str
    """Human-readable identifier of the rule that raised this flag."""

    description: str
    """Plain-language explanation of what was found and why it matters."""

    severity: int
    """Numeric severity contribution (0-100) added to the overall score."""


# ---------------------------------------------------------------------------
# Value object: aggregated result from the RiskAnalyzer
# ---------------------------------------------------------------------------

@dataclass
class RiskReport:
    """
    The complete output of a full analysis run.

    Attributes
    ----------
    address:    The Solana token / program address that was analysed.
    score:      Cumulative risk score capped at 100.
    severity:   Human label derived from score: BAJO / MEDIO / CRÍTICO.
    flags:      Ordered list of every RiskFlag that was raised.
    raw_inputs: The raw data dict passed into RiskAnalyzer.run().
                Kept here so the AI prompt builder can reference original
                on-chain values without re-fetching them.
    """

    address: str
    score: int
    severity: str
    flags: list[RiskFlag] = field(default_factory=list)
    raw_inputs: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Abstract base class: every rule implements this interface
# ---------------------------------------------------------------------------

class RiskRule(ABC):
    """
    Interface that all risk-detection rules must implement.

    Design rationale
    ----------------
    • `check()` receives the full *context* dict so rules stay stateless
      and can be unit-tested by simply passing a crafted dict — no mocks
      needed for the RPC client.
    • Returning `RiskFlag | None` keeps the orchestrator simple: it just
      filters out None values.
    • The `name` property gives each rule a canonical identifier used in
      logging, reports, and AI prompts.
    """

    @property
    def name(self) -> str:
        """Returns the class name as a stable rule identifier."""
        return self.__class__.__name__

    @abstractmethod
    def check(self, context: dict[str, Any]) -> RiskFlag | None:
        """
        Evaluate a single security rule against on-chain / simulation data.

        Parameters
        ----------
        context : dict
            A flat dictionary produced by the analysis pipeline.  Expected
            keys (all optional — rules must guard against missing keys):
              - ``mint_authority_enabled`` (bool)
              - ``freeze_authority_enabled`` (bool)
              - ``simulation_success`` (bool)
              - ``simulation_error`` (str | None)

        Returns
        -------
        RiskFlag | None
            A populated RiskFlag if the rule fires, or None if everything
            looks clean.
        """
