import sys, os
import bcrypt
sys.path.append(os.path.join(os.path.dirname(__file__), "counterfactual"))
sys.path.append(os.path.join(os.path.dirname(__file__), "envelope_optimisation"))


from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from counterfactual_router import router as counterfactual_router
from envelope_router import router as envelope_router


from database import Base, engine, get_db
from history_database import Base as HistoryBase, engine as history_engine, get_history_db
from models import User, Account, FixedCost, Envelope, Transaction, Transfer, MonthOpenSnapshot, Job, ShiftType, Shift
from history_models import MonthSummary, EnvelopeHistory, ShiftHistory, FixedCostHistory, GoalHistory
from month_close import gather_live_data, calculate_summaries, write_to_history, reset_live_db
from history_database import SessionLocal as HistorySession
from schemas import (UserCreate, UserResponse,
    PinInput, PinVerifyResponse,
    AccountCreate, AccountUpdate, AccountResponse,
    EnvelopeCreate, EnvelopeUpdate, EnvelopeResponse,
    FixedCostCreate, FixedCostUpdate, FixedCostResponse,
    TransactionCreate, TransactionUpdate, TransactionResponse,
    TransferCreate, TransferResponse,
    MonthOpenSnapshotCreate, MonthOpenSnapshotResponse,
    JobCreate, JobUpdate, JobResponse,
    ShiftTypeCreate, ShiftTypeResponse,
    ShiftCreate, ShiftUpdate, ShiftResponse,
)
from history_schemas import (
    MonthSummaryResponse,
    EnvelopeHistoryResponse,
    ShiftHistoryResponse,
    FixedCostHistoryResponse,
    GoalHistoryResponse,
)

# creates tables in db if they don't exist already
Base.metadata.create_all(bind=engine)
HistoryBase.metadata.create_all(bind=history_engine)

app = FastAPI()

app.include_router(counterfactual_router)
app.include_router(envelope_router)

# allows the frontend to make requests to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)




# onboarding complete check and pin check (for routing)
@app.get("/onboarding-status")
def onboarding_status(db: Session = Depends(get_db)):
    user = db.query(User).first()
    return {
        "completed": user is not None,
        "pin_set":   user is not None and user.pin is not None,
    }




##-----PIN Routes-----##

#sets the pin
@app.post("/auth/set-pin")
def set_pin(payload: PinInput, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")
    user.pin = bcrypt.hashpw(payload.pin.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"detail": "PIN set"}

#verifies it 
@app.post("/auth/verify-pin", response_model=PinVerifyResponse)
def verify_pin(payload: PinInput, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user or user.pin is None:
        raise HTTPException(status_code=400, detail="No PIN set")
    valid = bcrypt.checkpw(payload.pin.encode(), user.pin.encode())
    return {"valid": valid}


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user




##-----Account Routes-----##

@app.post("/accounts", response_model=AccountResponse)

def create_account(account: AccountCreate, db: Session = Depends(get_db)):

    new_account = Account(**account.model_dump())
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account




@app.get("/accounts", response_model=list[AccountResponse])

def get_accounts(db: Session = Depends(get_db)):

    return db.query(Account).all()



@app.put("/accounts/{account_id}", response_model=AccountResponse)

def update_account(account_id: str, updates: AccountUpdate, db: Session = Depends(get_db)):

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if updates.account_name is not None:
        account.account_name = updates.account_name
    if updates.balance is not None:
        account.balance = updates.balance
    if updates.account_type is not None:
        account.account_type = updates.account_type
    if updates.include_in_budget is not None:
        account.include_in_budget = updates.include_in_budget
    if updates.target_amount is not None:
        account.target_amount = updates.target_amount
    if updates.deadline is not None:
        account.deadline = updates.deadline

    db.commit()
    db.refresh(account)

    return account




@app.delete("/accounts/{account_id}")

def delete_account(account_id: str, db: Session = Depends(get_db)):

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()

    return {"detail": "Account deleted"}





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

    new_envelope = Envelope(**envelope.model_dump(), balance=envelope.allocated_amount)
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
        #if new allocation is lower than current balance reduce balance to new allocated amount 
        if envelope.balance > updates.allocated_amount:
            envelope.balance = updates.allocated_amount

    db.commit()
    db.refresh(envelope)

    return envelope


@app.delete("/envelopes/{envelope_id}")
def delete_envelope(envelope_id: str, db: Session = Depends(get_db)):

    envelope = db.query(Envelope).filter(Envelope.id == envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")

    has_transactions = db.query(Transaction).filter(Transaction.envelope_id == envelope_id).first()
    if has_transactions:
        raise HTTPException(status_code=400, detail="Cannot delete envelope with transactions")

    db.delete(envelope)
    db.commit()

    return {"detail": "Envelope deleted"}




##-----Transaction Routes-----##

@app.post("/transactions", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):

    envelope = db.query(Envelope).filter(Envelope.id == transaction.envelope_id).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Envelope not found")

    # deduct from balance only — allocated_amount stays fixed as the original budget
    envelope.balance = envelope.balance - transaction.amount

    new_transaction = Transaction(**transaction.model_dump())
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@app.get("/transactions/envelope/{envelope_id}", response_model=list[TransactionResponse])
def get_transactions_by_envelope(envelope_id: str, db: Session = Depends(get_db)):

    return db.query(Transaction).filter(Transaction.envelope_id == envelope_id).all()


@app.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: str, updates: TransactionUpdate, db: Session = Depends(get_db)):

    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if updates.description is not None:
        transaction.description = updates.description
    if updates.date is not None:
        transaction.date = updates.date

    db.commit()
    db.refresh(transaction)

    return transaction


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: str, db: Session = Depends(get_db)):

    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # restore the amount back to balance when a transaction is deleted
    envelope = db.query(Envelope).filter(Envelope.id == transaction.envelope_id).first()
    if envelope:
        envelope.balance = envelope.balance + transaction.amount

    db.delete(transaction)
    db.commit()

    return {"detail": "Transaction deleted"}




##-----Transfer Routes-----##

@app.post("/transfers", response_model=TransferResponse)
def create_transfer(transfer: TransferCreate, db: Session = Depends(get_db)):

    from_account = db.query(Account).filter(Account.id == transfer.from_account_id).first()
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")

    to_account = db.query(Account).filter(Account.id == transfer.to_account_id).first()
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found")

    if transfer.from_account_id == transfer.to_account_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same account")

    from_account.balance = from_account.balance - transfer.amount
    to_account.balance = to_account.balance + transfer.amount

    new_transfer = Transfer(**transfer.model_dump())
    db.add(new_transfer)
    db.commit()
    db.refresh(new_transfer)

    return new_transfer


@app.get("/transfers", response_model=list[TransferResponse])
def get_transfers(db: Session = Depends(get_db)):

    return db.query(Transfer).all()






##-----Month Open Snapshot Routes-----##

@app.post("/month-open-snapshot", response_model=MonthOpenSnapshotResponse)
def create_month_open_snapshot(snapshot: MonthOpenSnapshotCreate, db: Session = Depends(get_db)):


    #prevents duplicates
    existing = db.query(MonthOpenSnapshot).filter(
        MonthOpenSnapshot.month == snapshot.month,
        MonthOpenSnapshot.year == snapshot.year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Snapshot for this month already exists")
    

    #calculates total balance across all bank accounts incl in budget
    
    total = db.query(Account).filter(
        Account.account_type == "bank",
        Account.include_in_budget == True
    ).all()
    opening_balance = sum(a.balance for a in total)

    new_snapshot = MonthOpenSnapshot(
        month=snapshot.month,
        year=snapshot.year,
        accounts_opening_balance=opening_balance
    )
    db.add(new_snapshot)
    db.commit()
    db.refresh(new_snapshot)

    return new_snapshot


@app.get("/month-open-snapshot", response_model=list[MonthOpenSnapshotResponse])
def get_all_snapshots(db: Session = Depends(get_db)):

    return db.query(MonthOpenSnapshot).order_by(
        MonthOpenSnapshot.year.desc(),
        MonthOpenSnapshot.month.desc()
    ).all()


@app.get("/month-open-snapshot/{year}/{month}", response_model=MonthOpenSnapshotResponse)
def get_snapshot(year: int, month: int, db: Session = Depends(get_db)):

    snapshot = db.query(MonthOpenSnapshot).filter(
        MonthOpenSnapshot.month == month,
        MonthOpenSnapshot.year == year
    ).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    return snapshot



##-----Job Routes-----##

@app.post("/jobs", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):

    new_job = Job(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


@app.get("/jobs", response_model=list[JobResponse])
def get_jobs(db: Session = Depends(get_db)):

    return db.query(Job).all()



@app.put("/jobs/{job_id}", response_model=JobResponse)
def update_job(job_id: str, updates: JobUpdate, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if updates.job_name is not None:
        job.job_name = updates.job_name
    if updates.base_hourly_rate is not None:
        job.base_hourly_rate = updates.base_hourly_rate

    db.commit()
    db.refresh(job)

    return job



@app.delete("/jobs/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()

    return {"detail": "Job deleted"}




##-----Shift Routes-----##

@app.post("/shifts", response_model=ShiftResponse)
def create_shift(shift: ShiftCreate, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.job_id == shift.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    #calculates total pay in backend from user data 
    total_pay = shift.hours_worked * job.base_hourly_rate * shift.rate_multiplier

    new_shift = Shift(
        job_id=shift.job_id,
        date=shift.date,
        hours_worked=shift.hours_worked,
        shift_type=shift.shift_type,
        rate_multiplier=shift.rate_multiplier,
        total_pay=total_pay
    )
    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)

    return new_shift


##-----Shift Type CRUD-----##

@app.post("/shift-types", response_model=ShiftTypeResponse)
def create_shift_type(shift_type: ShiftTypeCreate, db: Session = Depends(get_db)):
    existing = db.query(ShiftType).filter(ShiftType.type_name == shift_type.type_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Shift type already exists")
    new_type = ShiftType(type_name=shift_type.type_name)
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type

@app.get("/shift-types", response_model=list[ShiftTypeResponse])
def get_shift_types(db: Session = Depends(get_db)):
    return db.query(ShiftType).all()

@app.delete("/shift-types/{shift_type_id}")
def delete_shift_type(shift_type_id: str, db: Session = Depends(get_db)):
    shift_type = db.query(ShiftType).filter(ShiftType.id == shift_type_id).first()
    if not shift_type:
        raise HTTPException(status_code=404, detail="Shift type not found")
    db.delete(shift_type)
    db.commit()
    return {"detail": "Shift type deleted"}


@app.get("/shifts", response_model=list[ShiftResponse])
def get_shifts(db: Session = Depends(get_db)):

    return db.query(Shift).all()


@app.get("/shifts/job/{job_id}", response_model=list[ShiftResponse])
def get_shifts_by_job(job_id: str, db: Session = Depends(get_db)):

    return db.query(Shift).filter(Shift.job_id == job_id).all()


@app.put("/shifts/{shift_id}", response_model=ShiftResponse)
def update_shift(shift_id: str, updates: ShiftUpdate, db: Session = Depends(get_db)):

    shift = db.query(Shift).filter(Shift.shift_id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    if updates.date is not None:
        shift.date = updates.date
    if updates.hours_worked is not None:
        shift.hours_worked = updates.hours_worked
    if updates.shift_type is not None:
        shift.shift_type = updates.shift_type
    if updates.rate_multiplier is not None:
        shift.rate_multiplier = updates.rate_multiplier



    #recalculate total_pay whenever shift details change
    job = db.query(Job).filter(Job.job_id == shift.job_id).first()
    shift.total_pay = shift.hours_worked * job.base_hourly_rate * shift.rate_multiplier

    db.commit()
    db.refresh(shift)

    return shift




@app.delete("/shifts/{shift_id}")
def delete_shift(shift_id: str, db: Session = Depends(get_db)):

    shift = db.query(Shift).filter(Shift.shift_id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    db.delete(shift)
    db.commit()

    return {"detail": "Shift deleted"}




##-----History Routes-----##

@app.get("/history/months", response_model=list[MonthSummaryResponse])
def get_all_month_summaries(db: Session = Depends(get_history_db)):
    return db.query(MonthSummary).order_by(
        MonthSummary.year.desc(),
        MonthSummary.month.desc(),
    ).all()


@app.get("/history/envelopes/{year}/{month}", response_model=list[EnvelopeHistoryResponse])
def get_envelope_history(year: int, month: int, db: Session = Depends(get_history_db)):
    return db.query(EnvelopeHistory).filter(
        EnvelopeHistory.month == month,
        EnvelopeHistory.year == year,
    ).all()


@app.get("/history/shifts/{year}/{month}", response_model=list[ShiftHistoryResponse])
def get_shift_history(year: int, month: int, db: Session = Depends(get_history_db)):
    return db.query(ShiftHistory).filter(
        ShiftHistory.month == month,
        ShiftHistory.year == year,
    ).order_by(ShiftHistory.date).all()


@app.get("/history/fixed-costs/{year}/{month}", response_model=list[FixedCostHistoryResponse])
def get_fixed_cost_history(year: int, month: int, db: Session = Depends(get_history_db)):
    return db.query(FixedCostHistory).filter(
        FixedCostHistory.month == month,
        FixedCostHistory.year == year,
    ).all()


@app.get("/history/goals/{year}/{month}", response_model=list[GoalHistoryResponse])
def get_goal_history(year: int, month: int, db: Session = Depends(get_history_db)):
    return db.query(GoalHistory).filter(
        GoalHistory.month == month,
        GoalHistory.year == year,
    ).all()




##-----Month Close-----##

class MonthCloseRequest(BaseModel):
    month: int
    year: int
    net_income: float

@app.post("/month-close")
def month_close(request: MonthCloseRequest, db: Session = Depends(get_db)):

    history_db = HistorySession()

    try:
        data      = gather_live_data(db, request.month, request.year)
        summaries = calculate_summaries(data, request.month, request.year, request.net_income)

        write_to_history(history_db, summaries, request.month, request.year)
        reset_live_db(db, request.month, request.year, request.net_income)

        return {"detail": "Month closed successfully"}

    except Exception as e:
        history_db.rollback()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        history_db.close()
