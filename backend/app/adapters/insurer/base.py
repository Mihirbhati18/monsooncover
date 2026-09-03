"""Insurer adapter contract (MONSOONCOVER_SPEC.md §12.2).

Core domain logic depends on this interface, never on a sandbox
implementation or a vendor payload. A future real adapter must pass the
same contract tests and map vendor responses into these canonical types.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from app.models.settlement import InsurerDecisionOutcome


@dataclass(frozen=True)
class InsurerSubmissionResult:
    external_request_id: str
    submitted_at_utc: datetime
    adapter_name: str
    adapter_version: str


@dataclass(frozen=True)
class InsurerDecisionResult:
    external_request_id: str
    outcome: InsurerDecisionOutcome
    reason: str
    decided_at_utc: datetime
    decided_by: str
    approved_amount: Decimal | None
    currency: str | None


class InsurerAdapter(ABC):
    name: str
    version: str

    @abstractmethod
    def submit_trigger_candidate(
        self, *, policy_snapshot_reference: str, trigger_evidence: dict, idempotency_key: str
    ) -> InsurerSubmissionResult:
        """Submits a candidate for review. Submitting is not approving."""

    @abstractmethod
    def get_decision(self, external_request_id: str) -> InsurerDecisionResult:
        """Returns the insurer's decision, or PENDING if none has been made."""

    @abstractmethod
    def get_payout_status(self, external_payout_id: str) -> str:
        """Returns the insurer-side payout status string."""
