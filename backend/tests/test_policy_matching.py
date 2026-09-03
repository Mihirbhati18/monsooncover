import inspect

from app.modules.policy_matching.engine import BorrowerFacts, EligibilityResult, match
from app.modules.policy_matching import engine as matching_engine

RULE = {
    "peril": "EXTREME_RAINFALL",
    "parameter": "precipitation",
    "normalized_unit": "mm",
    "aggregation": "SUM",
    "strike_threshold": "160.0",
    "near_trigger_threshold": "128.0",
    "zone_id": "SURAT-DEMO-Z1",
    "risk_period_start_local": "2026-06-15",
    "risk_period_end_local": "2026-09-30",
    "policy_timezone": "Asia/Kolkata",
    "required_provider": "HistoricalCSVProvider",
}

ELIGIBLE_BORROWER = BorrowerFacts(
    zone_id="SURAT-DEMO-Z1", sector="Textile manufacturing", requested_peril="EXTREME_RAINFALL"
)


def run(borrower=ELIGIBLE_BORROWER, rule=None, start="2026-06-15", end="2026-09-30", state="ACTIVE"):
    return match(
        borrower=borrower,
        trigger_rule=rule if rule is not None else RULE,
        cover_start_local=start,
        cover_end_local=end,
        policy_state=state,
    )


class TestRiskScoreNeverCreatesEligibility:
    """MONSOONCOVER_SPEC.md §7.2: "A risk score alone never creates
    eligibility." Enforced structurally, not by convention."""

    def test_the_matching_function_cannot_accept_a_risk_input(self):
        parameters = set(inspect.signature(match).parameters)
        forbidden = {"risk", "risk_score", "exposure", "exposure_band", "risk_assessment"}

        assert parameters.isdisjoint(forbidden), (
            "policy matching must not take a risk score or exposure band as input"
        )

    def test_borrower_facts_carry_no_exposure_band(self):
        fields = set(BorrowerFacts.__dataclass_fields__)
        assert fields.isdisjoint({"exposure_band", "risk_score", "risk_band"})

    def test_the_matching_module_never_imports_the_risk_engine(self):
        source = inspect.getsource(matching_engine)
        assert "risk_engine" not in source.replace("risk_engine.engine", "")

    def test_the_result_records_that_exposure_was_not_consulted(self):
        result = run()
        excluded = next(item for item in result.reasons if item["constraint"] == "risk_score_excluded")

        assert excluded["satisfied"] is True
        assert "never creates eligibility" in excluded["detail"]


class TestExplicitConstraints:
    def test_a_matching_borrower_is_eligible(self):
        result = run()

        assert result.is_eligible is True
        assert all(item["satisfied"] for item in result.reasons)

    def test_a_borrower_outside_the_covered_zone_is_not_eligible(self):
        result = run(
            BorrowerFacts(zone_id="BHARUCH-DEMO-Z2", sector="Paper products", requested_peril="EXTREME_RAINFALL")
        )

        assert result.is_eligible is False
        geography = next(item for item in result.reasons if item["constraint"] == "geography")
        assert geography["satisfied"] is False
        assert "does not match" in geography["detail"]

    def test_a_different_peril_is_not_eligible(self):
        result = run(
            BorrowerFacts(zone_id="SURAT-DEMO-Z1", sector="Apparel", requested_peril="HEAT_STRESS")
        )

        assert result.is_eligible is False
        assert next(i for i in result.reasons if i["constraint"] == "peril")["satisfied"] is False

    def test_cover_outside_the_risk_period_is_not_eligible(self):
        result = run(start="2026-05-01", end="2026-10-31")

        assert result.is_eligible is False
        assert next(i for i in result.reasons if i["constraint"] == "risk_period")["satisfied"] is False

    def test_a_non_active_policy_version_is_not_eligible(self):
        result = run(state="EXPIRED")

        assert result.is_eligible is False
        assert next(i for i in result.reasons if i["constraint"] == "policy_state")["satisfied"] is False

    def test_a_policy_without_a_settlement_source_is_not_eligible(self):
        rule = {key: value for key, value in RULE.items() if key != "required_provider"}
        result = run(rule=rule)

        assert result.is_eligible is False
        source = next(i for i in result.reasons if i["constraint"] == "settlement_source")
        assert source["satisfied"] is False
        assert "authorized provider" in source["detail"]


class TestExplainability:
    def test_every_constraint_is_recorded_whether_or_not_it_passed(self):
        result = run(
            BorrowerFacts(zone_id="ELSEWHERE", sector="Apparel", requested_peril="HEAT_STRESS")
        )

        assert {item["constraint"] for item in result.reasons} == {
            "geography",
            "peril",
            "risk_period",
            "policy_state",
            "settlement_source",
            "risk_score_excluded",
        }

    def test_the_result_is_a_typed_value_with_its_matching_version(self):
        result = run()

        assert isinstance(result, EligibilityResult)
        assert result.matching_version == "policy-matching-v1"
