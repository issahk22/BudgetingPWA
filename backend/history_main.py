from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from history_database import Base, engine, get_history_db
from history_models import MonthSummary, EnvelopeHistory, ShiftHistory
from history_schemas import MonthSummaryCreate, MonthSummaryResponse, EnvelopeHistoryCreate, EnvelopeHistoryResponse, ShiftHistoryCreate, ShiftHistoryResponse

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)




##-----Month Summary Routes-----##


@app.post("/month-summary", response_model=MonthSummaryResponse)
def create_monthly_summary(summary: MonthSummaryCreate, db: Session = Depends(get_history_db)):

    existing = db.query(MonthSummary).filter(
        MonthSummary.month == summary.month,
        MonthSummary.year == summary.year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Summary for this month already exists")

    new_summary = MonthSummary(**summary.model_dump())
    db.add(new_summary)
    db.commit()
    db.refresh(new_summary)

    return new_summary


@app.get("/month-summary", response_model=list[MonthSummaryResponse])
def get_all_summaries(db: Session = Depends(get_history_db)):

    return db.query(MonthSummary).order_by(
        MonthSummary.year.desc(),
        MonthSummary.month.desc()
    ).all()


@app.get("/month-summary/{year}/{month}", response_model=MonthSummaryResponse)
def get_monthly_summary(year: int, month: int, db: Session = Depends(get_history_db)):

    summary = db.query(MonthSummary).filter(
        MonthSummary.month == month,
        MonthSummary.year == year
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")

    return summary



##-----Envelope History Routes-----##


@app.post("/envelope-history", response_model=EnvelopeHistoryResponse)
def create_envelope_history(envelope: EnvelopeHistoryCreate, db: Session = Depends(get_history_db)):

    existing = db.query(EnvelopeHistory).filter( #composite primary key
        EnvelopeHistory.month == envelope.month,
        EnvelopeHistory.year == envelope.year,
        EnvelopeHistory.envelope_name == envelope.envelope_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Envelope history for this month already exists")

    new_envelope = EnvelopeHistory(**envelope.model_dump())
    db.add(new_envelope)
    db.commit()
    db.refresh(new_envelope)

    return new_envelope


@app.get("/envelope-history/{year}/{month}", response_model=list[EnvelopeHistoryResponse])
def get_envelope_history(year: int, month: int, db: Session = Depends(get_history_db)):

    results = db.query(EnvelopeHistory).filter(
        EnvelopeHistory.month == month,
        EnvelopeHistory.year == year
    ).all()
    if not results:
        raise HTTPException(status_code=404, detail="No envelope history found for this month")

    return results



##-----Shift History Routes-----##


@app.post("/shift-history", response_model=ShiftHistoryResponse)
def create_shift_history(shift: ShiftHistoryCreate, db: Session = Depends(get_history_db)):

    total_pay = shift.hours_worked * shift.hourly_base_rate * shift.rate_multiplier

    new_shift = ShiftHistory(
        **shift.model_dump(),
        total_pay=total_pay
    )
    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)

    return new_shift


@app.get("/shift-history/{year}/{month}", response_model=list[ShiftHistoryResponse])
def get_shift_history(year: int, month: int, db: Session = Depends(get_history_db)):

    results = db.query(ShiftHistory).filter(
        ShiftHistory.month == month,
        ShiftHistory.year == year
    ).all()
    if not results:
        raise HTTPException(status_code=404, detail="No shift history found for this month")

    return results
