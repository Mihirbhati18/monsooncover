import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Role(str, enum.Enum):
    """MONSOONCOVER_SPEC.md §15.1: role-based access for lender, insurer-sandbox,
    admin, and borrower/demo views. Names match the frontend's WorkspaceRole."""

    LENDER = "lender"
    INSURER = "insurer"
    BORROWER = "borrower"
    ADMIN = "admin"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
