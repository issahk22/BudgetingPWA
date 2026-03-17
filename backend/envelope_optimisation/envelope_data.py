import sqlite3
import os

HISTORY_DB = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "counterfactual", "history.db"
)


def get_envelope_panel():
    
    conn = sqlite3.connect(HISTORY_DB)
    cursor = conn.cursor()

    # fetches a list of all envelope names used in history 
    cursor.execute(
        "SELECT DISTINCT envelope_name FROM envelope_history ORDER BY envelope_name"
    )
    envelope_names = sorted([row[0] for row in cursor.fetchall()])

    #fetches actual spending per envelope grouped by month (for every closed month)
    cursor.execute("""
        SELECT month, year, envelope_name, actual_spent
        FROM envelope_history
        ORDER BY year, month
    """)
    envelope_rows = cursor.fetchall()

    #total income for each closed month 
    cursor.execute("""
        SELECT month, year, shift_calculated_income
        FROM month_summary
        ORDER BY year, month
    """)
    income_rows = cursor.fetchall()

    conn.close()

    #dict for income (key is month, year)
    income_lookup = {
        (row[0], row[1]): float(row[2]) for row in income_rows
    }

    #collapses envelope rows into one dict per month
    monthly = {}

    for month, year, name, spent in envelope_rows:
        key = (month, year)

        if key not in monthly:
            monthly[key] = {
                "month": month,
                "year": year,
                "envelope_spending": {n: 0.0 for n in envelope_names},
            }

        monthly[key]["envelope_spending"][name] = float(spent)

    #attaches income and build final panel
    panel = []

    for key, record in monthly.items():
        if key not in income_lookup:
            continue

        record["income"] = income_lookup[key]
        panel.append(record)

    
    panel.sort(key=lambda r: (r["year"], r["month"]))

    return panel, envelope_names


def validate_envelope_data(panel, n_envelopes):
    #checks enough data to run 

    minimum = 3
    n = len(panel)

    if n_envelopes == 0:
        return {
            "sufficient": False,
            "months_available": n,
            "minimum_required": minimum,
            "error": "No envelope history found.",
        }

    return {
        "months_available": n,
        "sufficient": n >= minimum,
        "minimum_required": minimum,
    }
