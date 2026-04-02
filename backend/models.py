from sqlalchemy import Column, String, Integer, Numeric, Boolean, UniqueConstraint
import uuid

from database import Base

#defines db tables


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, nullable=False, unique=True)
    # bcrypt hash of the user's 4-digit PIN, or NULL if no lock is configured.
    # verified via POST /auth/verify-pin — never sent to the frontend.
    pin = Column(String, nullable=True)


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_name = Column(String, nullable=False)
    balance = Column(Numeric(12, 2), nullable=False)
    account_type = Column(String, nullable=False)
    include_in_budget = Column(Boolean, nullable=False, default=True)  # pots are excluded from budget total by default
    #pots can optionally have a savings goal attached (target amount + deadline)
    target_amount = Column(Numeric(12, 2), nullable=True)
    deadline = Column(String, nullable=True)
    # required monthly save to hit target by deadline (ceil'd for a pessimistic estimate)
    monthly_contribution = Column(Numeric(12, 2), nullable=True)


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


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    envelope_id = Column(String, nullable=False)
    account_id = Column(String, nullable=True)
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



class ShiftType(Base):
    __tablename__ = "shift_types"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type_name = Column(String, nullable=False, unique=True)
    rate_multiplier = Column(Numeric(4, 3), nullable=False, default=1.000)


class Shift(Base):
    __tablename__ = "shifts"

    shift_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, nullable=False)       # references jobs.job_id
    date = Column(String, nullable=False)
    hours_worked = Column(Numeric(5, 2), nullable=False)
    shift_type = Column(String, nullable=False)   # "regular" | "overtime" | "night" | "weekend"
    rate_multiplier = Column(Numeric(4, 3), nullable=False, default=1.000)
    total_pay = Column(Numeric(12, 2), nullable=False)  # hours_worked x base_hourly_rate x rate_multiplier
