"""
tests/test_risk_engine.py
--------------------------
Unit tests for the Cypher Risk Engine.

Run with:
    cd backend
    pytest tests/ -v

No Solana RPC connection is required — every test passes plain dicts
as context, proving that rules are fully decoupled from infrastructure.
"""

from __future__ import annotations

import pytest

from analyzers import (
    FreezeAuthorityRule,
    MintAuthorityRule,
    RiskAnalyzer,
    RiskReport,
    SimulationSuccessRule,
    SupplyConcentrationRule,
)


# ============================================================
# Individual rule tests
# ============================================================

class TestMintAuthorityRule:
    rule = MintAuthorityRule()

    def test_fires_when_mint_authority_enabled(self):
        flag = self.rule.check({"mint_authority_enabled": True})
        assert flag is not None
        assert flag.severity == 45
        assert "Mint" in flag.rule_name

    def test_clean_when_mint_authority_disabled(self):
        flag = self.rule.check({"mint_authority_enabled": False})
        assert flag is None

    def test_clean_when_key_absent(self):
        """Missing data must not raise — rule should skip defensively."""
        flag = self.rule.check({})
        assert flag is None


class TestFreezeAuthorityRule:
    rule = FreezeAuthorityRule()

    def test_fires_when_freeze_authority_enabled(self):
        flag = self.rule.check({"freeze_authority_enabled": True})
        assert flag is not None
        assert flag.severity == 35

    def test_clean_when_freeze_authority_disabled(self):
        flag = self.rule.check({"freeze_authority_enabled": False})
        assert flag is None


class TestSimulationSuccessRule:
    rule = SimulationSuccessRule()

    def test_fires_when_simulation_failed(self):
        flag = self.rule.check({
            "simulation_success": False,
            "simulation_error": "custom program error: 0x1",
        })
        assert flag is not None
        assert "custom program error" in flag.description
        assert flag.severity == 20

    def test_clean_when_simulation_succeeded(self):
        flag = self.rule.check({"simulation_success": True})
        assert flag is None

    def test_skips_when_no_simulation_provided(self):
        """No simulation_success key → rule is not applicable."""
        flag = self.rule.check({})
        assert flag is None


class TestSupplyConcentrationRule:
    rule = SupplyConcentrationRule()

    def test_fires_above_threshold(self):
        flag = self.rule.check({"top_holder_pct": 95.0})
        assert flag is not None
        assert "95.0%" in flag.description

    def test_clean_below_threshold(self):
        flag = self.rule.check({"top_holder_pct": 30.0})
        assert flag is None

    def test_skips_when_data_unavailable(self):
        flag = self.rule.check({})
        assert flag is None


# ============================================================
# RiskAnalyzer orchestrator tests
# ============================================================

class TestRiskAnalyzer:

    def _make_analyzer(self) -> RiskAnalyzer:
        return RiskAnalyzer.with_default_rules()

    def test_critical_score_all_flags(self):
        """All rules fire → score must be capped at 100."""
        report: RiskReport = self._make_analyzer().run(
            address="TokenXYZ",
            context={
                "mint_authority_enabled": True,    # +45
                "freeze_authority_enabled": True,   # +35
                "simulation_success": False,        # +20
                "simulation_error": "Error 0x1",
                "top_holder_pct": 90.0,            # +25
            },
        )
        assert report.score == 100           # capped
        assert report.severity == "CRÍTICO"
        assert len(report.flags) == 4

    def test_clean_score_no_flags(self):
        """No rule fires → score 0, BAJO severity, empty flags."""
        report = self._make_analyzer().run(
            address="SafeToken",
            context={
                "mint_authority_enabled": False,
                "freeze_authority_enabled": False,
                "simulation_success": True,
                "top_holder_pct": 10.0,
            },
        )
        assert report.score == 0
        assert report.severity == "BAJO"
        assert report.flags == []

    def test_partial_score_medio(self):
        """Only freeze authority → score 35 → MEDIO."""
        report = self._make_analyzer().run(
            address="MedioToken",
            context={"freeze_authority_enabled": True},
        )
        assert report.score == 35
        assert report.severity == "MEDIO"

    def test_raw_inputs_preserved(self):
        """Context dict must be stored in report for AI prompt building."""
        ctx = {"mint_authority_enabled": True}
        report = self._make_analyzer().run(address="TestAddr", context=ctx)
        assert report.raw_inputs == ctx

    def test_address_stored_in_report(self):
        report = self._make_analyzer().run(address="Addr123", context={})
        assert report.address == "Addr123"

    def test_custom_rule_injection(self):
        """Demonstrates DI: inject only one rule."""
        analyzer = RiskAnalyzer(rules=[MintAuthorityRule()])
        report = analyzer.run(
            address="Custom",
            context={"mint_authority_enabled": True, "freeze_authority_enabled": True},
        )
        # Only MintAuthority was injected; freeze is ignored.
        assert report.score == 45
        assert len(report.flags) == 1


# ============================================================
# AI prompt generation tests
# ============================================================

class TestAIPromptGeneration:

    def test_prompt_contains_address(self):
        analyzer = RiskAnalyzer.with_default_rules()
        report = analyzer.run("SomeAddr", {"mint_authority_enabled": True})
        prompt = analyzer.build_ai_prompt(report)
        assert "SomeAddr" in prompt

    def test_prompt_contains_score(self):
        analyzer = RiskAnalyzer.with_default_rules()
        report = analyzer.run("Addr", {"mint_authority_enabled": True})
        prompt = analyzer.build_ai_prompt(report)
        assert str(report.score) in prompt

    def test_prompt_no_flags_message(self):
        analyzer = RiskAnalyzer.with_default_rules()
        report = analyzer.run("CleanToken", {})
        prompt = analyzer.build_ai_prompt(report)
        assert "No se detectaron" in prompt

    def test_prompt_includes_rule_names(self):
        analyzer = RiskAnalyzer.with_default_rules()
        report = analyzer.run("RiskyToken", {"mint_authority_enabled": True})
        prompt = analyzer.build_ai_prompt(report)
        assert "MintAuthorityRule" in prompt
