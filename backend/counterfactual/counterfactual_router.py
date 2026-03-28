from fastapi import APIRouter
from pydantic import BaseModel
import sqlite3, os
from counterfactual import counterfactual_hindsight, counterfactual_forecasting
from causal_data import get_monthly_panel, validate_data_sufficiency

router = APIRouter(prefix="/counterfactual")

HISTORY_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "history.db")


class HindsightRequest(BaseModel):
    month: int
    year: int
    cf_hours: dict 



@router.get("/shift-types")
def get_shift_types():
    """Returns the list of shift types found in the user's history."""
    _, shift_types = get_monthly_panel()
    return shift_types


@router.get("/sufficiency")
def get_sufficiency():
    """Returns whether there is enough history to run counterfactual models."""
    panel, shift_types = get_monthly_panel()
    check = validate_data_sufficiency(panel, len(shift_types))
    return {
        "months_available":  check["months_available"],
        "minimum_required":  check["minimum_required"],
        "sufficient":        check["sufficient"],
        "n_shift_types":     len(shift_types),
        "error":             check.get("error"),
    }


@router.get("/month-summary/{year}/{month}")
def get_month_summary(year: int, month: int):
    conn = sqlite3.connect(HISTORY_DB)

    hours = conn.execute("""
        SELECT shift_type, SUM(hours_worked)
        FROM shift_history
        WHERE month = ? AND year = ?
        GROUP BY shift_type
    """, (month, year)).fetchall()

    summary = conn.execute("""
        SELECT shift_calculated_income, total_spent
        FROM month_summary
        WHERE month = ? AND year = ?
    """, (month, year)).fetchone()

    conn.close()

    if not summary:
        return {}

    hours_by_type = {row[0]: row[1] for row in hours}
    income = summary[0]
    total_spent = summary[1]

    return {
        "hours": hours_by_type,
        "income": income,
        "total_spent": total_spent,
        "left_over": round(income - total_spent, 2),
    }


@router.get("/shifts/{year}/{month}")
def get_shifts_for_month(year: int, month: int):
    conn = sqlite3.connect(HISTORY_DB)
    rows = conn.execute("""
        SELECT date, shift_type, hours_worked, rate_multiplier, total_pay
        FROM shift_history
        WHERE month = ? AND year = ?
        ORDER BY date
    """, (month, year)).fetchall()
    conn.close()
    return [
        {
            "date": r[0],
            "shift_type": r[1],
            "hours_worked": r[2],
            "rate_multiplier": r[3],
            "total_pay": r[4],
        }
        for r in rows
    ]


class ShiftPlanningRequest(BaseModel):
    planned_hours: dict  # {"regular": 32, "night": 8, ...}


@router.post("/hindsight")
def hindsight(request: HindsightRequest):
    return counterfactual_hindsight(
        target_month=request.month,
        target_year=request.year,
        cf_hours=request.cf_hours,
    )


@router.post("/shift-planning")
def shift_planning(request: ShiftPlanningRequest):
    return counterfactual_forecasting(
        planned_hours=request.planned_hours,
    )


