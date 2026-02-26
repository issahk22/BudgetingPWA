from pydantic import BaseModel
from decimal import Decimal




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
