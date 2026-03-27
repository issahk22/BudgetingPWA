
import sqlite3
import os

HISTORY_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "history.db")


def get_monthly_panel():

    """
    returns (panel, shift_types)

    panel: list of dicts, each with:
        month, year, hours_by_type (dict), total_hours, income, total_spent, savings

    """

    conn = sqlite3.connect(HISTORY_DB)
    cursor = conn.cursor()

    # fresh install: history db may have no tables yet (no months closed)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='shift_history'")
    if not cursor.fetchone():
        conn.close()
        return [], []

    # find different shift types within the data
    cursor.execute("SELECT DISTINCT shift_type FROM shift_history ORDER BY shift_type")
    shift_types = sorted([row[0] for row in cursor.fetchall()])

    # pull hours worked grouped by month, year, and type
    cursor.execute("""
        SELECT month, year, shift_type, SUM(hours_worked) AS total_hours
        FROM shift_history
        GROUP BY month, year, shift_type
        ORDER BY year, month
    """)

    shift_rows = cursor.fetchall()

    # pull income and spending from month_summary
    cursor.execute("""
        SELECT month, year, shift_calculated_income, total_spent
        FROM month_summary
        ORDER BY year, month
    """)
    summary_rows = cursor.fetchall()

    # pull savings from goal_history
    cursor.execute("""
        SELECT month, year, SUM(amount_at_month_end)
        FROM goal_history
        GROUP BY month, year
        ORDER BY year, month
    """)
    goal_rows = cursor.fetchall()
    conn.close()

    # lookup dicts for joining results by (month, year)
    summary_lookup = {
        (row[0], row[1]): (float(row[2]), float(row[3]))
        for row in summary_rows
    }

    savings_lookup = {
        (row[0], row[1]): float(row[2])
        for row in goal_rows
    }

    # collapse shift rows into one dict of dicts per month
    monthly_collapse = {}

    for month, year, shift_type, hours in shift_rows:
        key = (month, year)

        if key not in monthly_collapse:
            monthly_collapse[key] = {
                "month": month,
                "year": year,
                "hours_by_type": {t: 0.0 for t in shift_types},
            }

        monthly_collapse[key]["hours_by_type"][shift_type] = float(hours)

    # attach financial details to month;y_collapse
    panel = []

    for key, record in monthly_collapse.items():
        if key not in summary_lookup:
            continue

        income, total_spent = summary_lookup[key]

        record["total_hours"] = round(sum(record["hours_by_type"].values()), 2)
        record["income"] = income
        record["total_spent"] = total_spent
        record["savings"] = savings_lookup.get(key, 0.0)

        panel.append(record)

    # sort oldest to newest
    panel.sort(key=lambda r: (r["year"], r["month"]))

    return panel, shift_types


MAX_SHIFT_TYPES = 5
MINIMUM_MONTHS = 6


def validate_data_sufficiency(panel, n_shift_types):
    #checks enough history for OLS. Max 5 shift types.
    #flat floor of 6 months regardless of shift type count
    #(6 also covers the OLS requirement of n_shift_types + 1 since max is 5)

    if n_shift_types > MAX_SHIFT_TYPES:
        return {
            "months_available": len(panel),
            "sufficient": False,
            "minimum_required": None,
            "error": f"Too many shift types ({n_shift_types}). Maximum allowed is {MAX_SHIFT_TYPES}.",
        }

    n = len(panel)

    return {

        "months_available": n,
        "sufficient": n >= MINIMUM_MONTHS,
        "minimum_required": MINIMUM_MONTHS,
    }
