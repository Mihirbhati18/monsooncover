"""SandboxLenderAdapter — an in-process stand-in for a lender servicing API.

MONSOONCOVER_SPEC.md §8.3: the lender servicing API and the actual
movement of money are simulated. This records an illustrative credit
against a demo loan and moves no real funds.
"""

from datetime import datetime, timezone
from decimal import Decimal

from app.adapters.lender.base import LenderAdapter, LenderLoanRecord, LenderPostingResult


class SandboxLenderAdapter(LenderAdapter):
    name = "SandboxLenderAdapter"
    version = "1.0"

    def __init__(self, loans: dict[str, LenderLoanRecord] | None = None) -> None:
        self._loans: dict[str, LenderLoanRecord] = loans or {}
        self._postings: dict[str, LenderPostingResult] = {}
        self._by_idempotency_key: dict[str, str] = {}

    def register_loan(self, record: LenderLoanRecord) -> None:
        self._loans[record.external_loan_id] = record

    def get_loan(self, *, lender_id: str, external_loan_id: str) -> LenderLoanRecord:
        if external_loan_id not in self._loans:
            raise KeyError(f"Lender {lender_id} has no loan {external_loan_id}")
        return self._loans[external_loan_id]

    def post_insurance_credit(
        self,
        *,
        loan_id: str,
        amount: Decimal,
        currency: str,
        payout_reference: str,
        idempotency_key: str,
    ) -> LenderPostingResult:
        # §13: replaying a posting must return the original and never create
        # a second credit against the loan.
        if idempotency_key in self._by_idempotency_key:
            return self._postings[self._by_idempotency_key[idempotency_key]]

        if loan_id not in self._loans:
            raise KeyError(f"Unknown loan {loan_id}")
        if amount <= 0:
            raise ValueError("A posting amount must be positive.")

        external_posting_id = f"LND-POST-{len(self._postings) + 1:05d}"
        result = LenderPostingResult(
            external_posting_id=external_posting_id,
            payout_reference=payout_reference,
            amount=amount,
            currency=currency,
            status="POSTED",
            posted_at_utc=datetime.now(timezone.utc),
        )
        self._postings[external_posting_id] = result
        self._by_idempotency_key[idempotency_key] = external_posting_id

        existing = self._loans[loan_id]
        self._loans[loan_id] = LenderLoanRecord(
            external_loan_id=existing.external_loan_id,
            outstanding_amount=existing.outstanding_amount - amount,
            currency=existing.currency,
        )
        return result

    def get_posting_status(self, external_posting_id: str) -> str:
        posting = self._postings.get(external_posting_id)
        return posting.status if posting else "UNKNOWN"
