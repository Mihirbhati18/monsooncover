from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Loan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A synthetic working-capital/equipment/term loan (MONSOONCOVER_SPEC.md §9).
    Money fields use NUMERIC/Decimal, never floating point, per §11.5."""

    __tablename__ = "loans"

    borrower_id: Mapped[str] = mapped_column(ForeignKey("borrowers.id"), nullable=False)
    loan_type: Mapped[str] = mapped_column(String(255), nullable=False)
    principal_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    emi_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)

    borrower: Mapped["Borrower"] = relationship(back_populates="loans")
