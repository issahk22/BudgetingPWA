from pydantic import BaseModel
from decimal import Decimal



##       User Schemas         ##

class UserCreate(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: str
    username: str
    class Config:
        from_attributes = True




##-----Bank Account Schemas-----##

class BankAccountCreate(BaseModel):
    account_name: str
    balance: Decimal


class BankAccountUpdate(BaseModel):
    account_name: str | None = None
    balance: Decimal | None = None

class BankAccountResponse(BaseModel):
    account_name: str
    balance: Decimal
    class Config:
        from_attributes = True




##-----Pot Schemas-----##

class PotCreate(BaseModel):
    pot_name: str
    balance: Decimal

class PotUpdate(BaseModel):
    pot_name: str | None = None
    balance: Decimal | None = None


class PotResponse(BaseModel):
    id: str
    pot_name: str
    balance: Decimal
    class Config:
        from_attributes = True
