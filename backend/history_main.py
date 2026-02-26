from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from history_database import Base, engine, get_history_db
from history_models import MonthSummary
from history_schemas import MonthSummaryCreate, MonthSummaryResponse

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
