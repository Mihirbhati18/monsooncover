from decimal import Decimal

from sqlalchemy import Numeric, String
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

    # §6.6: "A city name alone is insufficient for executable policy
    # evaluation." Coverage must be explicit, so the borrower carries the
    # versioned zone identifier and coordinates used for matching.
    zone_id: Mapped[str] = mapped_column(String(128), nullable=False, default="UNZONED")
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)

    loans: Mapped[list["Loan"]] = relationship(back_populates="borrower")
