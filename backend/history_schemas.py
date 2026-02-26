from pydantic import BaseModel
from decimal import Decimal
from datetime import date




##-----Month Summary Schemas-----##

class MonthSummaryCreate(BaseModel):
    month: int
    year: int
    accounts_opening_balance: Decimal
    accounts_closing_balance: Decimal
    total_income: Decimal
    total_spent: Decimal
    shifts_worked: int
    hours_worked: Decimal

class MonthSummaryResponse(BaseModel):
    month: int
    year: int
    accounts_opening_balance: Decimal
    accounts_closing_balance: Decimal
    total_income: Decimal
    total_spent: Decimal
    shifts_worked: int
    hours_worked: Decimal

    class Config:
        from_attributes = True



##-----Envelope History Schemas-----##

class EnvelopeHistoryCreate(BaseModel):
    month: int
    year: int
    envelope_name: str
    allocated_amount: Decimal
    actual_spent: Decimal
    difference: Decimal
    overspent: bool

class EnvelopeHistoryResponse(BaseModel):
    month: int
    year: int
    envelope_name: str
    allocated_amount: Decimal
    actual_spent: Decimal
    difference: Decimal
    overspent: bool

    class Config:
        from_attributes = True



##-----Shift History Schemas-----##

class ShiftHistoryCreate(BaseModel):
    month: int
    year: int
    date: date
    job_id: int
    hourly_base_rate: Decimal
    hours_worked: Decimal
    shift_type: str
    rate_multiplier: Decimal

class ShiftHistoryResponse(BaseModel):
    id: int
    month: int
    year: int
    date: date
    job_id: int
    hourly_base_rate: Decimal
    hours_worked: Decimal
    shift_type: str
    rate_multiplier: Decimal
    total_pay: Decimal

    class Config:
        from_attributes = True




##-----Fixed Cost History Schemas-----##

class FixedCostHistoryCreate(BaseModel):
    month: int
    year: int
    cost_name: str
    amount: Decimal
    was_paid: bool

class FixedCostHistoryResponse(BaseModel):
    month: int
    year: int
    cost_name: str
    amount: Decimal
    was_paid: bool

    class Config:
        from_attributes = True



##-----Goal History Schemas-----##

class GoalHistoryCreate(BaseModel):
    month: int
    year: int
    goal_name: str
    target_amount: Decimal
    amount_at_month_end: Decimal
    on_track: bool

class GoalHistoryResponse(BaseModel):
    month: int
    year: int
    goal_name: str
    target_amount: Decimal
    amount_at_month_end: Decimal
    on_track: bool

    class Config:
        from_attributes = True
