from sqlalchemy import Column, String, Integer, Numeric, Boolean
import uuid

from database import Base

#defines db tables


class User(Base):
    __tablename__ = "users"

    # id automatically generated for each user as a primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())) 

    username = Column(String, nullable=False, unique=True)

    pin = Column(Integer, nullable=True)


class BankAccount(Base):
    __tablename__ = "bank_accounts"


    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    account_name = Column(String, nullable=False)

    balance = Column(Numeric(12, 2), nullable=False)     #numeric(12, 2) for max 2 decimal places


class Pot(Base):
    __tablename__ = "pots"


    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    pot_name = Column(String, nullable=False)

    balance = Column(Numeric(12, 2), nullable=False)



class FixedCost(Base):
    __tablename__ = "fixed_costs"


    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    cost_name = Column(String, nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)

    # whether this cost has been paid for the current month, defaults to false
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

    current_savings = Column(Numeric(12, 2), nullable=True)  #optional

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

