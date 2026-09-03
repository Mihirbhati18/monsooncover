import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import Role, User
from app.modules.auth.service import get_user_by_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError as error:
        raise CREDENTIALS_ERROR from error

    email = payload.get("sub")
    if email is None:
        raise CREDENTIALS_ERROR

    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise CREDENTIALS_ERROR

    return user


def require_role(*allowed_roles: Role):
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted to perform this action.",
            )
        return current_user

    return _check
