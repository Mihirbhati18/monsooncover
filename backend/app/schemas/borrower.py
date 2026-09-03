from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BorrowerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sector: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=255)
    state: str = Field(min_length=1, max_length=255)
    zone_id: str = Field(default="UNZONED", min_length=1, max_length=128)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)


class BorrowerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    sector: str
    city: str
    state: str
    zone_id: str
    latitude: Decimal | None
    longitude: Decimal | None
