from sqlalchemy import Column, String, Integer, Numeric, Boolean, UniqueConstraint
import uuid

from database import Base

#defines db tables


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, nullable=False, unique=True)
    pin = Column(Integer, nullable=True)


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_name = Column(String, nullable=False)
    balance = Column(Numeric(12, 2), nullable=False)
    account_type = Column(String, nullable=False)
    include_in_budget = Column(Boolean, nullable=False, default=True)  # pots are excluded from budget total by default


class FixedCost(Base):
    __tablename__ = "fixed_costs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cost_name = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    paid = Column(Boolean, nullable=False, default=False)


class Envelope(Base):
    __tablename__ = "envelopes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    envelope_name = Column(String, nullable=False)
    allocated_amount = Column(Numeric(12, 2), nullable=False)
    balance = Column(Numeric(12, 2), nullable=False)


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_savings = Column(Numeric(12, 2), nullable=True)
    deadline = Column(String, nullable=True)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    envelope_id = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(String, nullable=True)
    date = Column(String, nullable=True)


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    from_account_id = Column(String, nullable=False)
    to_account_id = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(String, nullable=True)
    description = Column(String, nullable=True)

class MonthOpenSnapshot(Base):
    __tablename__ = "month_open_snapshots"

    month = Column(Integer, primary_key=True, nullable=False)
    year = Column(Integer, primary_key=True, nullable=False)
    accounts_opening_balance = Column(Numeric(12, 2), nullable=False)


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_name = Column(String, nullable=False)
    base_hourly_rate = Column(Numeric(12, 2), nullable=False)



class Shift(Base):
    __tablename__ = "shifts"

    shift_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, nullable=False)       # references jobs.job_id
    date = Column(String, nullable=False)
    hours_worked = Column(Numeric(5, 2), nullable=False)
    shift_type = Column(String, nullable=False)   # "regular" | "overtime" | "night" | "weekend"
    rate_multiplier = Column(Numeric(4, 2), nullable=False, default=1.00)
    total_pay = Column(Numeric(12, 2), nullable=False)  # hours_worked x base_hourly_rate x rate_multiplier
