from sqlalchemy.orm import Session
from datetime import date
from database import SessionLocal as LiveSession
from history_database import SessionLocal as HistorySession
from models import Account, FixedCost, Envelope, Shift, Job, MonthOpenSnapshot
from history_models import MonthSummary, EnvelopeHistory, ShiftHistory, FixedCostHistory, GoalHistory

def get_live_db():
    db = LiveSession()
    try:
        yield db
    finally:
        db.close()


def get_history_db():
    db = HistorySession()
    try:
        yield db
    finally:
        db.close()




#Gathers data from the current month 
def gather_live_data(live_db: Session, month: int, year: int):

    bank_accounts = live_db.query(Account).filter(
        Account.account_type == "bank",
        Account.include_in_budget == True
    ).all()

    #pots with a savings target act as the goals (1 pot = 1 goal)
    pots = live_db.query(Account).filter(
        Account.account_type == "pot",
        Account.target_amount.isnot(None)
    ).all()

    envelopes = live_db.query(Envelope).all()
    fixed_costs = live_db.query(FixedCost).all()
    shifts = live_db.query(Shift).all()
    jobs = live_db.query(Job).all()
    snapshot = live_db.query(MonthOpenSnapshot).filter(
        MonthOpenSnapshot.month == month,
        MonthOpenSnapshot.year == year
    ).first()



    return {
        "bank_accounts": bank_accounts,
        "envelopes": envelopes,
        "fixed_costs": fixed_costs,
        "shifts": shifts,
        "jobs": jobs,
        "pots": pots,
        "snapshot": snapshot,
    }



#calculates all summary figures from gathered live data to feed to history db 
def calculate_summaries(data: dict, month: int, year: int, net_income: float) -> dict:

    bank_accounts = data["bank_accounts"]
    envelopes     = data["envelopes"]
    shifts        = data["shifts"]
    jobs          = data["jobs"]
    pots          = data["pots"]
    snapshot      = data["snapshot"]

    job_map = {job.job_id: job for job in jobs}


    #month summary calculation

    accounts_opening_balance = float(snapshot.accounts_opening_balance) if snapshot else 0.0
    accounts_closing_balance = sum(float(acc.balance) for acc in bank_accounts)

    shift_calculated_income = sum(float(s.total_pay) for s in shifts)
    total_spent      = sum(float(env.allocated_amount) - float(env.balance) for env in envelopes)
    shifts_worked    = len(shifts)
    total_hours      = sum(float(s.hours_worked) for s in shifts)


    #envelope  calculations

    envelope_summaries = []
    for e in envelopes:
        actual_spent = float(e.allocated_amount) - float(e.balance)
        difference   = float(e.allocated_amount) - actual_spent   # remaining balance
        overspent    = actual_spent > float(e.allocated_amount)

        envelope_summaries.append ({
            "envelope_name":    e.envelope_name,
            "allocated_amount": float(e.allocated_amount),
            "actual_spent":     actual_spent,
            "difference":       difference,
            "overspent":        overspent,
        })



    shift_summaries = []
    for s in shifts:
        job = job_map.get(s.job_id)
        shift_summaries.append({
            "job_id":           s.job_id,
            "hourly_base_rate": float(job.base_hourly_rate) if job else 0.0,
            #convert string date to Python date object needed by SQLAlchemy 
            "date":             date.fromisoformat(s.date) if isinstance(s.date, str) else s.date,
            "hours_worked":     float(s.hours_worked),
            "shift_type":       s.shift_type,
            "rate_multiplier":  float(s.rate_multiplier),
            "total_pay":        float(s.total_pay),
        })



    fixed_cost_summaries = []
    for cost in data["fixed_costs"]:
        fixed_cost_summaries.append({
            "cost_name": cost.cost_name,
            "amount":    float(cost.amount),
            "was_paid":  cost.paid,
        })


   
    goal_summaries = []
    for pot in pots:
        amount_at_month_end = float(pot.balance)
        target              = float(pot.target_amount)

        #ontrack: deadline has not yet passed, or goal has already been met
        if pot.deadline:
            deadline    = date.fromisoformat(pot.deadline)
            today       = date.today()
            on_track    = amount_at_month_end >= target or deadline >= today
        else:
            on_track = True

        goal_summaries.append({
            "goal_id":            pot.id,
            "target_amount":      target,
            "amount_at_month_end": amount_at_month_end,
            "on_track":           on_track,
        })


    return {
        "month_summary": {

            "month":                     month,
            "year":                      year,
            "accounts_opening_balance":  accounts_opening_balance,
            "accounts_closing_balance":  accounts_closing_balance,
            "shift_calculated_income":   shift_calculated_income,
            "actual_net_income":         net_income,
            "total_spent":               total_spent,
            "shifts_worked":             shifts_worked,
            "hours_worked":              total_hours,

        },

        "envelope_summaries":   envelope_summaries,
        "shift_summaries":      shift_summaries,
        "fixed_cost_summaries": fixed_cost_summaries,
        "goal_summaries":       goal_summaries,


    }



#writes everything to history db 
def write_to_history(history_db: Session, summaries: dict, month: int, year: int):

    try:

        ms = summaries["month_summary"]
        history_db.add(MonthSummary(
            month                    = ms["month"],
            year                     = ms["year"],
            accounts_opening_balance = ms["accounts_opening_balance"],
            accounts_closing_balance = ms["accounts_closing_balance"],
            shift_calculated_income  = ms["shift_calculated_income"],
            actual_net_income        = ms["actual_net_income"],
            total_spent              = ms["total_spent"],
            shifts_worked            = ms["shifts_worked"],
            hours_worked             = ms["hours_worked"],
        ))


        for e in summaries["envelope_summaries"]:
            history_db.add(EnvelopeHistory(
                month            = month,
                year             = year,
                envelope_name    = e["envelope_name"],
                allocated_amount = e["allocated_amount"],
                actual_spent     = e["actual_spent"],
                difference       = e["difference"],
                overspent        = e["overspent"],
            ))


        for s in summaries["shift_summaries"]:
            history_db.add(ShiftHistory(
                month            = month,
                year             = year,
                job_id           = s["job_id"],
                hourly_base_rate = s["hourly_base_rate"],
                date             = s["date"],
                hours_worked     = s["hours_worked"],
                shift_type       = s["shift_type"],
                rate_multiplier  = s["rate_multiplier"],
                total_pay        = s["total_pay"],
            ))


        for c in summaries["fixed_cost_summaries"]:
            history_db.add(FixedCostHistory(
                month     = month,
                year      = year,
                cost_name = c["cost_name"],
                amount    = c["amount"],
                was_paid  = c["was_paid"],
            ))


        for g in summaries["goal_summaries"]:
            history_db.add(GoalHistory(
                month               = month,
                year                = year,
                goal_id             = g["goal_id"],
                target_amount       = g["target_amount"],
                amount_at_month_end = g["amount_at_month_end"],
                on_track            = g["on_track"],
            ))


        history_db.commit()


#failsafe, if anything fails nothing is written
    except Exception as e:
        history_db.rollback()
        raise e



#resets the live db for the new month 
def reset_live_db(live_db: Session, month: int, year: int, net_income: float):

    try:

        #resets envelope balances back to original allocated amount
        envelopes = live_db.query(Envelope).all()
        for env in envelopes:
            env.balance = env.allocated_amount


        #reset all fixed costs to unpaid
        fixed_costs = live_db.query(FixedCost).all()
        for cost in fixed_costs:
            cost.paid = False


        #deletes all shifts for the month
        live_db.query(Shift).delete()


        #add net income to the primary bank account (first bank account ordered by name)
        primary_account = live_db.query(Account).filter(
            Account.account_type == "bank",
            Account.include_in_budget == True
        ).order_by(Account.account_name).first()

        if primary_account:
            primary_account.balance = float(primary_account.balance) + net_income


        #calculat new opening balance
        bank_accounts = live_db.query(Account).filter(
            Account.account_type == "bank",
            Account.include_in_budget == True
        ).all()
        new_opening_balance = sum(float(acc.balance) for acc in bank_accounts)

        #write new month open snapshot
        new_month = month + 1 if month < 12 else 1
        new_year  = year if month < 12 else year + 1

        existing = live_db.query(MonthOpenSnapshot).filter(
            MonthOpenSnapshot.month == new_month,
            MonthOpenSnapshot.year  == new_year
        ).first()

        if not existing:
            live_db.add(MonthOpenSnapshot(
                month                    = new_month,
                year                     = new_year,
                accounts_opening_balance = new_opening_balance,
            ))


        live_db.commit()

    except Exception as e:
        live_db.rollback()
        raise e
