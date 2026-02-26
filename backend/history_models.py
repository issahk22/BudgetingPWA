from sqlalchemy import Column, Integer, Numeric
from history_database import Base


##-----History Tables-----##


class MonthSummary(Base):
    __tablename__ = "month_summary"

    month = Column(Integer, primary_key=True, nullable=False)
    year = Column(Integer, primary_key=True, nullable=False)
    accounts_opening_balance = Column(Numeric(12, 2), nullable=False)
    accounts_closing_balance = Column(Numeric(12, 2), nullable=False)
    total_income = Column(Numeric(12, 2), nullable=False)
    total_spent = Column(Numeric(12, 2), nullable=False)
    shifts_worked = Column(Integer, nullable=False)
    hours_worked = Column(Numeric(6, 2), nullable=False)
