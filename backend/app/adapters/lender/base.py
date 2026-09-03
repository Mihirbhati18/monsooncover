"""Lender adapter contract (MONSOONCOVER_SPEC.md §12.1)."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class LenderLoanRecord:
    external_loan_id: str
    outstanding_amount: Decimal
    currency: str


@dataclass(frozen=True)
class LenderPostingResult:
    external_posting_id: str
    payout_reference: str
    amount: Decimal
    currency: str
    status: str
    posted_at_utc: datetime


class LenderAdapter(ABC):
    name: str
    version: str

    @abstractmethod
    def get_loan(self, *, lender_id: str, external_loan_id: str) -> LenderLoanRecord:
        ...

    @abstractmethod
    def post_insurance_credit(
        self,
        *,
        loan_id: str,
        amount: Decimal,
        currency: str,
        payout_reference: str,
        idempotency_key: str,
    ) -> LenderPostingResult:
        ...

    @abstractmethod
    def get_posting_status(self, external_posting_id: str) -> str:
        ...
