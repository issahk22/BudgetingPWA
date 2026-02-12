from pydantic import BaseModel
from decimal import Decimal


#Defines the api request and responses, what gets sent back


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




##-----Fixed Cost Schemas-----##


class FixedCostCreate(BaseModel):
    cost_name: str
    amount: Decimal
    paid: bool = False

class FixedCostUpdate(BaseModel):
    cost_name: str | None = None
    amount: Decimal | None = None
    paid: bool | None = None

class FixedCostResponse(BaseModel):
    id: str
    cost_name: str
    amount: Decimal
    paid: bool
    class Config:
        from_attributes = True
