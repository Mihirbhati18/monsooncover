"""Policy Library and registered dataset reads.

§5 keeps policy references separate from any claim of partnership: a
version here is a reference/demo configuration, never evidence that a
product is commercially available to a demo borrower.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.climate import ClimateDataset
from app.models.policy import BorrowerPolicySnapshot, PolicyVersion
from app.models.user import Role, User
from app.modules.auth.deps import require_role
from app.schemas.policy import ClimateDatasetRead, PolicySnapshotRead, PolicyVersionRead

router = APIRouter(tags=["policy-library"])

VIEWERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER, Role.BORROWER)


@router.get("/policies/versions", response_model=list[PolicyVersionRead])
def list_policy_versions(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(PolicyVersion).order_by(PolicyVersion.product_code)))


@router.get("/policies/snapshots", response_model=list[PolicySnapshotRead])
def list_policy_snapshots(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    """Immutable accepted terms (§10.4). Nothing updates these after
    creation; later configuration changes cannot alter an accepted
    snapshot."""
    return list(
        db.scalars(select(BorrowerPolicySnapshot).order_by(BorrowerPolicySnapshot.accepted_at_utc))
    )


@router.get("/climate/datasets", response_model=list[ClimateDatasetRead])
def list_climate_datasets(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    """Registered frozen datasets with their §6.4 integrity fields."""
    return list(db.scalars(select(ClimateDataset).order_by(ClimateDataset.dataset_code)))
