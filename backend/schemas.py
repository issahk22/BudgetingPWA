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




##-----Account Schemas-----##

class AccountCreate(BaseModel):
    account_name: str
    balance: Decimal
    account_type: str           # "bank" or "pot"
    include_in_budget: bool = True

class AccountUpdate(BaseModel):
    account_name: str | None = None
    balance: Decimal | None = None
    account_type: str | None = None
    include_in_budget: bool | None = None

class AccountResponse(BaseModel):
    id: str
    account_name: str
    balance: Decimal
    account_type: str
    include_in_budget: bool
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




##-----Envelope Schemas-----##

class EnvelopeCreate(BaseModel):
    envelope_name: str
    allocated_amount: Decimal

class EnvelopeUpdate(BaseModel):
    envelope_name: str | None = None
    allocated_amount: Decimal | None = None

class EnvelopeResponse(BaseModel):
    id: str
    envelope_name: str
    allocated_amount: Decimal
    balance: Decimal
    class Config:
        from_attributes = True



##-----Goal Schemas-----##

class GoalCreate(BaseModel):
    target_amount: Decimal
    current_savings: Decimal | None = None
    deadline: str | None = None

class GoalUpdate(BaseModel):
    target_amount: Decimal | None = None
    current_savings: Decimal | None = None
    deadline: str | None = None

class GoalResponse(BaseModel):
    id: str
    target_amount: Decimal
    current_savings: Decimal | None
    deadline: str | None
    class Config:
        from_attributes = True




##-----Transaction Schemas-----##

class TransactionCreate(BaseModel):
    envelope_id: str
    amount: Decimal
    description: str | None = None
    date: str | None = None

class TransactionUpdate(BaseModel):
    description: str | None = None
    date: str | None = None

class TransactionResponse(BaseModel):
    id: str
    envelope_id: str
    amount: Decimal
    description: str | None
    date: str | None
    class Config:
        from_attributes = True




##-----Transfer Schemas-----##

class TransferCreate(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: Decimal
    date: str | None = None
    description: str | None = None

class TransferResponse(BaseModel):
    id: str
    from_account_id: str
    to_account_id: str
    amount: Decimal
    date: str | None
    description: str | None
    class Config:
        from_attributes = True
