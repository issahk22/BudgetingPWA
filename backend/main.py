from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session


from database import Base, engine, get_db
from models import User, BankAccount, Pot, FixedCost, Envelope
from schemas import (UserCreate, UserResponse,
    BankAccountCreate, BankAccountUpdate, BankAccountResponse,
    PotCreate, PotUpdate, PotResponse,
    EnvelopeCreate, EnvelopeUpdate, EnvelopeResponse,
    FixedCostCreate, FixedCostUpdate, FixedCostResponse,
)

# creates tables in db if they don't exist already
Base.metadata.create_all(bind=engine)

app = FastAPI()

# allows the frontend to make requests to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)




#omboarding complete check
@app.get("/onboarding-status")
def onboarding_status(db: Session = Depends(get_db)):
    user = db.query(User).first()
    return {"completed": user is not None}


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):

    # check if user already exists
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    # create new user and pushes to db
    new_user = User(username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # refreshes so that the id is populated instead of keeping it none.

    return new_user




##-----Bank Account Routes-----##

@app.post("/bank-accounts", response_model=BankAccountResponse)
def create_bank_account(account: BankAccountCreate, db: Session = Depends(get_db)):

    new_account = BankAccount(**account.model_dump())
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account


# GET returns all bank accounts
@app.get("/bank-accounts", response_model=list[BankAccountResponse])
def get_bank_accounts(db: Session = Depends(get_db)):

    return db.query(BankAccount).all()


# PUT updates name and/or balance of a bank account
@app.put("/bank-accounts/{account_id}", response_model=BankAccountResponse)
def update_bank_account(account_id: str, updates: BankAccountUpdate, db: Session = Depends(get_db)):

    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    # only update fields that were provided in the request
    if updates.account_name is not None:
        account.account_name = updates.account_name
    if updates.balance is not None:
        account.balance = updates.balance

    db.commit()
    db.refresh(account)

    return account


#deletes a bank account by its ID
@app.delete("/bank-accounts/{account_id}")
def delete_bank_account(account_id: str, db: Session = Depends(get_db)):

    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    db.delete(account)
    db.commit()

    return {"detail": "Bank account deleted"}






##-----Pot Routes-----##

@app.post("/pots", response_model=PotResponse)
def create_pot(pot: PotCreate, db: Session = Depends(get_db)):

    new_pot = Pot(**pot.model_dump())
    db.add(new_pot)
    db.commit()
    db.refresh(new_pot)

    return new_pot


#returns all pots
@app.get("/pots", response_model=list[PotResponse])
def get_pots(db: Session = Depends(get_db)):

    return db.query(Pot).all()


@app.put("/pots/{pot_id}", response_model=PotResponse)
def update_pot(pot_id: str, updates: PotUpdate, db: Session = Depends(get_db)):

    pot = db.query(Pot).filter(Pot.id == pot_id).first()
    if not pot:
        raise HTTPException(status_code=404, detail="Pot not found")

    if updates.pot_name is not None:
        pot.pot_name = updates.pot_name
    if updates.balance is not None:
        pot.balance = updates.balance

    db.commit()
    db.refresh(pot)

    return pot


@app.delete("/pots/{pot_id}")
def delete_pot(pot_id: str, db: Session = Depends(get_db)):

    pot = db.query(Pot).filter(Pot.id == pot_id).first()
    if not pot:
        raise HTTPException(status_code=404, detail="Pot not found")

    db.delete(pot)
    db.commit()

    return {"detail": "Pot deleted"}







##-----Fixed Cost Routes-----##

@app.post("/fixed-costs", response_model=FixedCostResponse)
def create_fixed_cost(cost: FixedCostCreate, db: Session = Depends(get_db)):

    new_cost = FixedCost(**cost.model_dump())
    db.add(new_cost)
    db.commit()
    db.refresh(new_cost)

    return new_cost



@app.get("/fixed-costs", response_model=list[FixedCostResponse])
def get_fixed_costs(db: Session = Depends(get_db)):

    return db.query(FixedCost).all()


@app.put("/fixed-costs/{cost_id}", response_model=FixedCostResponse)
def update_fixed_cost(cost_id: str, updates: FixedCostUpdate, db: Session = Depends(get_db)):

    cost = db.query(FixedCost).filter(FixedCost.id == cost_id).first()
    if not cost:
        raise HTTPException(status_code=404, detail="Fixed cost not found")



    if updates.cost_name is not None:
        cost.cost_name = updates.cost_name
    if updates.amount is not None:
        cost.amount = updates.amount
    if updates.paid is not None:
        cost.paid = updates.paid

    db.commit()
    db.refresh(cost)

    return cost



@app.delete("/fixed-costs/{cost_id}")
def delete_fixed_cost(cost_id: str, db: Session = Depends(get_db)):

    cost = db.query(FixedCost).filter(FixedCost.id == cost_id).first()
    if not cost:
        raise HTTPException(status_code=404, detail="Fixed cost not found")

    db.delete(cost)
    db.commit()

    return {"detail": "Fixed cost deleted"}





##-----Envelope Routes-----##

@app.post("/envelopes", response_model=EnvelopeResponse)
def create_envelope(envelope: EnvelopeCreate, db: Session = Depends(get_db)):

    new_envelope = Envelope(**envelope.model_dump())
    db.add(new_envelope)
    db.commit()
    db.refresh(new_envelope)

    return new_envelope


@app.get("/envelopes", response_model=list[EnvelopeResponse])
def get_envelopes(db: Session = Depends(get_db)):

    return db.query(Envelope).all()


@app.put("/envelopes/{envelope_id}", response_model=EnvelopeResponse)
def update_envelope(envelope_id: str, updates: EnvelopeUpdate, db: Session = Depends(get_db)):

    envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")

    if updates.envelope_name is not None:
        envelope.envelope_name = updates.envelope_name
    if updates.allocated_amount is not None:
        envelope.allocated_amount = updates.allocated_amount

    db.commit()
    db.refresh(envelope)

    return envelope


@app.delete("/envelopes/{envelope_id}")
def delete_envelope(envelope_id: str, db: Session = Depends(get_db)):

    envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")

    db.delete(envelope)
    db.commit()

    return {"detail": "Envelope deleted"}
