import sqlite3
import os

HISTORY_DB = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "history.db"
)


def get_envelope_panel():

    conn = sqlite3.connect(HISTORY_DB)
    cursor = conn.cursor()

    # fetches all distinct envelope ids and their most recent display name
    # MAX(year*100+month) picks the snapshot label from the latest closed month
    # so renames are reflected without needing a join to the live db
    cursor.execute("""
        SELECT envelope_id, envelope_name
        FROM envelope_history eh
        WHERE (year * 100 + month) = (
            SELECT MAX(year * 100 + month)
            FROM envelope_history
            WHERE envelope_id = eh.envelope_id
        )
        ORDER BY envelope_id
    """)
    id_name_rows = cursor.fetchall()
    envelope_ids = sorted([row[0] for row in id_name_rows])
    id_to_name = {row[0]: row[1] for row in id_name_rows}

    #fetches actual spending per envelope grouped by month (for every closed month)
    cursor.execute("""
        SELECT month, year, envelope_id, actual_spent
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

    #collapses envelope rows into one dict per month, keyed by envelope_id
    monthly = {}

    for month, year, env_id, spent in envelope_rows:
        key = (month, year)

        if key not in monthly:
            monthly[key] = {
                "month": month,
                "year": year,
                "envelope_spending": {eid: 0.0 for eid in envelope_ids},
            }

        monthly[key]["envelope_spending"][env_id] = float(spent)

    #attaches income and build final panel
    panel = []

    for key, record in monthly.items():
        if key not in income_lookup:
            continue

        record["income"] = income_lookup[key]
        panel.append(record)


    panel.sort(key=lambda r: (r["year"], r["month"]))

    return panel, envelope_ids, id_to_name


def validate_envelope_data(panel, n_envelopes):
    #checks enough data to run

    minimum = 6
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

