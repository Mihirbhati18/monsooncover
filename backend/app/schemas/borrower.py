from pydantic import BaseModel, ConfigDict, Field


class BorrowerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sector: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=255)
    state: str = Field(min_length=1, max_length=255)


class BorrowerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    sector: str
    city: str
    state: str
