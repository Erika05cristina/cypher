# analyzers/__init__.py
# Public API surface — import from here, not from sub-modules directly.

from .base import RiskFlag, RiskReport, RiskRule
from .risk_analyzer import RiskAnalyzer
from .rules import (
    FreezeAuthorityRule,
    MintAuthorityRule,
    SimulationSuccessRule,
    SupplyConcentrationRule,
)

__all__ = [
    # Abstractions
    "RiskRule",
    "RiskFlag",
    "RiskReport",
    # Orchestrator
    "RiskAnalyzer",
    # Concrete rules
    "MintAuthorityRule",
    "FreezeAuthorityRule",
    "SimulationSuccessRule",
    "SupplyConcentrationRule",
]
