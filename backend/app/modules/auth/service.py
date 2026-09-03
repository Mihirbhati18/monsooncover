from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import Role, User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(db: Session, *, email: str, password: str, display_name: str, role: Role) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password),
        display_name=display_name,
        role=role,
    )
    db.add(user)
    db.flush()
    return user
