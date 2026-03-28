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


##       PIN / Auth Schemas         ##

class PinInput(BaseModel):
    pin: str

class PinVerifyResponse(BaseModel):
    valid: bool




##-----Account Schemas-----##

class AccountCreate(BaseModel):
    account_name: str
    balance: Decimal
    account_type: str           # "bank" or "pot"
    include_in_budget: bool = True
    #optional savings goal fields for pots
    target_amount: Decimal | None = None
    deadline: str | None = None

class AccountUpdate(BaseModel):
    account_name: str | None = None
    balance: Decimal | None = None
    account_type: str | None = None
    include_in_budget: bool | None = None
    target_amount: Decimal | None = None
    deadline: str | None = None

class AccountResponse(BaseModel):
    id: str
    account_name: str
    balance: Decimal
    account_type: str
    include_in_budget: bool
    target_amount: Decimal | None
    deadline: str | None
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



##-----Month Open Snapshot Schemas-----##

class MonthOpenSnapshotCreate(BaseModel):
    month: int
    year: int
    accounts_opening_balance: Decimal

class MonthOpenSnapshotResponse(BaseModel):
    month: int
    year: int
    accounts_opening_balance: Decimal
    class Config:
        from_attributes = True


##-----Job Schemas-----##

class JobCreate(BaseModel):
    job_name: str
    base_hourly_rate: Decimal

class JobUpdate(BaseModel):
    job_name: str | None = None
    base_hourly_rate: Decimal | None = None

class JobResponse(BaseModel):
    job_id: str
    job_name: str
    base_hourly_rate: Decimal
    class Config:
        from_attributes = True






##-----Shift Schemas-----##

class ShiftCreate(BaseModel):
    job_id: str
    date: str
    hours_worked: Decimal
    shift_type: str
    rate_multiplier: Decimal = Decimal("1.00")

class ShiftUpdate(BaseModel):
    date: str | None = None
    hours_worked: Decimal | None = None
    shift_type: str | None = None
    rate_multiplier: Decimal | None = None

class ShiftResponse(BaseModel):
    shift_id: str
    job_id: str
    date: str
    hours_worked: Decimal
    shift_type: str
    rate_multiplier: Decimal
    total_pay: Decimal
    class Config:
        from_attributes = True



##-----Shift Type Schemas-----##

class ShiftTypeCreate(BaseModel):
    type_name: str

class ShiftTypeResponse(BaseModel):
    id: str
    type_name: str
    class Config:
        from_attributes = True

