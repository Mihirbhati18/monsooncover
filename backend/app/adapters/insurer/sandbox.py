"""SandboxInsurerAdapter — an in-process stand-in for a real insurer system.

MONSOONCOVER_SPEC.md §8.3 lists insurer submission, decision, settlement
and payout APIs as simulated. Critically, §12.2 requires that approval
remains a sandbox *action*, never a trigger-engine side effect: this
adapter therefore holds every submission at PENDING until a human (or an
explicit test/demo call) records a decision through `record_decision`.

Nothing here approves anything on its own.
"""

from datetime import datetime, timezone
from decimal import Decimal

from app.adapters.insurer.base import InsurerAdapter, InsurerDecisionResult, InsurerSubmissionResult
from app.models.settlement import InsurerDecisionOutcome


class SandboxInsurerAdapter(InsurerAdapter):
    name = "SandboxInsurerAdapter"
    version = "1.0"

    def __init__(self) -> None:
        self._submissions: dict[str, dict] = {}
        self._decisions: dict[str, InsurerDecisionResult] = {}
        self._by_idempotency_key: dict[str, str] = {}

    def submit_trigger_candidate(
        self, *, policy_snapshot_reference: str, trigger_evidence: dict, idempotency_key: str
    ) -> InsurerSubmissionResult:
        # §13: a replayed submission returns the original result and never
        # creates a second request.
        if idempotency_key in self._by_idempotency_key:
            existing_id = self._by_idempotency_key[idempotency_key]
            record = self._submissions[existing_id]
            return InsurerSubmissionResult(
                external_request_id=existing_id,
                submitted_at_utc=record["submitted_at_utc"],
                adapter_name=self.name,
                adapter_version=self.version,
            )

        external_request_id = f"INS-REQ-{len(self._submissions) + 1:05d}"
        submitted_at = datetime.now(timezone.utc)
        self._submissions[external_request_id] = {
            "policy_snapshot_reference": policy_snapshot_reference,
            "trigger_evidence": trigger_evidence,
            "submitted_at_utc": submitted_at,
        }
        self._by_idempotency_key[idempotency_key] = external_request_id

        return InsurerSubmissionResult(
            external_request_id=external_request_id,
            submitted_at_utc=submitted_at,
            adapter_name=self.name,
            adapter_version=self.version,
        )

    def ensure_submission(self, external_request_id: str, *, submitted_at_utc: datetime) -> None:
        """Re-registers a submission this adapter has no memory of.

        The sandbox holds its state in process, so a server restart loses it
        while the authoritative InsurerRequest row survives in the database.
        The API uses this to rehydrate before recording a decision. A real
        insurer adapter would not need it — the external system would be the
        one remembering."""

        self._submissions.setdefault(
            external_request_id,
            {"policy_snapshot_reference": None, "trigger_evidence": {}, "submitted_at_utc": submitted_at_utc},
        )

    def record_decision(
        self,
        *,
        external_request_id: str,
        outcome: InsurerDecisionOutcome,
        reason: str,
        decided_by: str,
        approved_amount: Decimal | None = None,
        currency: str | None = None,
    ) -> InsurerDecisionResult:
        """The explicit sandbox user action. Not callable by the engine."""

        if external_request_id not in self._submissions:
            raise KeyError(f"Unknown insurer request {external_request_id}")
        if not reason or not reason.strip():
            raise ValueError("A decision reason is mandatory (§15.3).")
        if outcome is InsurerDecisionOutcome.APPROVED and (approved_amount is None or approved_amount <= 0):
            raise ValueError("An approved decision requires a positive approved amount.")

        decision = InsurerDecisionResult(
            external_request_id=external_request_id,
            outcome=outcome,
            reason=reason,
            decided_at_utc=datetime.now(timezone.utc),
            decided_by=decided_by,
            approved_amount=approved_amount,
            currency=currency,
        )
        self._decisions[external_request_id] = decision
        return decision

    def get_decision(self, external_request_id: str) -> InsurerDecisionResult:
        if external_request_id not in self._submissions:
            raise KeyError(f"Unknown insurer request {external_request_id}")

        if external_request_id not in self._decisions:
            return InsurerDecisionResult(
                external_request_id=external_request_id,
                outcome=InsurerDecisionOutcome.PENDING,
                reason="Awaiting independent insurer-sandbox review.",
                decided_at_utc=self._submissions[external_request_id]["submitted_at_utc"],
                decided_by="",
                approved_amount=None,
                currency=None,
            )
        return self._decisions[external_request_id]

    def get_payout_status(self, external_payout_id: str) -> str:
        return "PAID" if external_payout_id in {d.external_request_id for d in self._decisions.values()} else "UNKNOWN"
