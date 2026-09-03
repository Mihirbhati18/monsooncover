from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class LoanCreate(BaseModel):
    borrower_id: str
    loan_type: str = Field(min_length=1, max_length=255)
    principal_amount: Decimal = Field(gt=0)
    emi_amount: Decimal = Field(gt=0)
    outstanding_amount: Decimal = Field(ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)


class LoanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    borrower_id: str
    loan_type: str
    principal_amount: Decimal
    emi_amount: Decimal
    outstanding_amount: Decimal
    currency: str
