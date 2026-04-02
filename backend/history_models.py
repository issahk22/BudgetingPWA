from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date
from history_database import Base


##-----History Tables-----##


class MonthSummary(Base):
    __tablename__ = "month_summary"

    month = Column(Integer, primary_key=True, nullable=False)
    year = Column(Integer, primary_key=True, nullable=False)
    accounts_opening_balance = Column(Numeric(12, 2), nullable=False)
    accounts_closing_balance = Column(Numeric(12, 2), nullable=False)
    shift_calculated_income = Column(Numeric(12, 2), nullable=False)
    actual_net_income = Column(Numeric(12, 2), nullable=False)
    total_spent = Column(Numeric(12, 2), nullable=False)
    shifts_worked = Column(Integer, nullable=False)
    hours_worked = Column(Numeric(6, 2), nullable=False)


class EnvelopeHistory(Base):
    __tablename__ = "envelope_history"

    month = Column(Integer, primary_key=True, nullable=False)
    year = Column(Integer, primary_key=True, nullable=False)
    envelope_id = Column(String, primary_key=True, nullable=False)
    envelope_name = Column(String, nullable=False) 
    allocated_amount = Column(Numeric(12, 2), nullable=False)
    actual_spent = Column(Numeric(12, 2), nullable=False)
    difference = Column(Numeric(12, 2), nullable=False)
    overspent = Column(Boolean, nullable=False)



class ShiftHistory(Base):
    __tablename__ = "shift_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    job_id = Column(String, nullable=False)
    hourly_base_rate = Column(Numeric(8, 2), nullable=False)
    hours_worked = Column(Numeric(6, 2), nullable=False)
    shift_type = Column(String, nullable=False)
    rate_multiplier = Column(Numeric(4, 3), nullable=False)
    total_pay = Column(Numeric(12, 2), nullable=False)


class FixedCostHistory(Base):
    __tablename__ = "fixed_cost_history"

    month = Column(Integer, primary_key=True, nullable=False)
    year = Column(Integer, primary_key=True, nullable=False)
    cost_name = Column(String, primary_key=True, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    was_paid = Column(Boolean, nullable=False)


class GoalHistory(Base):
    __tablename__ = "goal_history"

    month = Column(Integer, primary_key=True, nullable=False)
    year = Column(Integer, primary_key=True, nullable=False)
    goal_id = Column(String, primary_key=True, nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    amount_at_month_end = Column(Numeric(12, 2), nullable=False)
    on_track = Column(Boolean, nullable=False)
