from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.borrowers.router import router as borrowers_router
from app.modules.loans.router import router as loans_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(borrowers_router)
api_router.include_router(loans_router)
