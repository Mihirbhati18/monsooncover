from fastapi import APIRouter

from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.borrowers.router import router as borrowers_router
from app.modules.loans.router import router as loans_router
from app.modules.settlement.router import router as settlement_router
from app.modules.trigger_engine.router import router as triggers_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(borrowers_router)
api_router.include_router(loans_router)
api_router.include_router(triggers_router)
api_router.include_router(settlement_router)
api_router.include_router(audit_router)
