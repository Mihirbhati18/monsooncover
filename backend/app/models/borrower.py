from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Borrower(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A synthetic MSME borrower record (MONSOONCOVER_SPEC.md §8.2, §8.3).
    Identity, contact, and KYC fields are simulated for the hackathon MVP;
    see §8.4 — real KYC/PAN/Aadhaar integration is explicitly out of scope."""

    __tablename__ = "borrowers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(255), nullable=False)

    loans: Mapped[list["Loan"]] = relationship(back_populates="borrower")
