

import numpy as np
import sqlite3
import os
import random
from sklearn.linear_model import LinearRegression
from causal_data import get_monthly_panel, validate_data_sufficiency

HISTORY_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "history.db")

### USE CASE 1 ###



# ordinary least squares (OLS) via scikit-learn
# X = input features (hours per shift type)
# y = target variable (income or spending)
# β (coef_) = learned weight per feature
# R² (score) = model accuracy from 0-1


def ols_income_model(panel: list[dict], shift_types: list[str]) -> dict:

    """
    Model A: income ~ intercept + β_type1 * hours_type1 + β_type2 * hours_type2 + ...


    """

    # each row = [hours_for_type1, hours_for_type2, ...]
    X = [[r["hours_by_type"].get(t, 0.0) for t in shift_types] for r in panel]
    y = [r["income"] for r in panel]

    # fit linear regression 
    model = LinearRegression().fit(X, y)

    # residuals = actual - predicted (personal gap per month)
    predictions = model.predict(X)
    residuals = [actual - pred for actual, pred in zip(y, predictions)]

    return {
        "intercept": model.intercept_,          # baseline income with 0 hours
        "coefficients": model.coef_.tolist(),    # one β per shift type, same order as shift_types
        "residuals": residuals,                  # one residual per month
        "r_squared": model.score(X, y),          # how well the model fits the data
        "shift_types": shift_types,              # column order so callers know which β is which
    }


def ols_spending_model(panel: list[dict]) -> dict:

    """
    Model B: total_spent ~ intercept + β_income * income 

   
    """

    # each row = [income]
    X = [[r["income"]] for r in panel]
    y = [r["total_spent"] for r in panel]

    model = LinearRegression().fit(X, y)

    predictions = model.predict(X)
    residuals = [actual - pred for actual, pred in zip(y, predictions)]

    return {
        "intercept": model.intercept_,
        "coefficients": model.coef_.tolist(),    # [β_income]
        "residuals": residuals,
        "r_squared": model.score(X, y),
    }


# PREDICTION FUNCTIONS
# applies models a and b, gets called in the counterfactual engine step 2 + 3

def predict_income(income_model: dict, hours_by_type: dict) -> float:
    shift_types = income_model["shift_types"]
    coeffs = income_model["coefficients"]
    # intercept + sum of (β * hours) per shift type
    return income_model["intercept"] + sum(
        coeffs[i] * hours_by_type.get(t, 0.0) for i, t in enumerate(shift_types)
    )


def predict_spending(spending_model: dict, income: float) -> float:
    # intercept + β_income * income
    return spending_model["intercept"] + spending_model["coefficients"][0] * income


## Spending Ratio Failsafe ##
# when counterfactual hours exceed historical max by 1/3, the OLS spending model switches to outputting a ratio instead 

#returns true if any shift type hours exceed the historical max by 1/3
def _exceeds_historical_range(panel, shift_types, hours_by_type):
    for t in shift_types:
        max_hist = max((r["hours_by_type"].get(t, 0.0) for r in panel), default=0.0)
        if hours_by_type.get(t, 0.0) > max_hist * (4 / 3):
            return True
    return False

#returns average ratio of total spent / income across all months 
def _historical_spending_ratio(panel):
    ratios = [r["total_spent"] / r["income"] for r in panel if r["income"] > 0]
    return sum(ratios) / len(ratios) if ratios else 0.5

#uses spending ratio if threshold exceeded OR if OLS learned a negative income coefficient (economically nonsensical)
def _predict_spending_safe(spending_model, income, panel, shift_types, hours_by_type):
    if _exceeds_historical_range(panel, shift_types, hours_by_type) or spending_model["coefficients"][0] <= 0:
        ratio = _historical_spending_ratio(panel)
        return max(0.0, income * ratio)
    return predict_spending(spending_model, income)


## Monte Carlo Layer ##

def monte_carlo(income_model, spending_model, hours, panel=None, shift_types=None, n_simulations=1000): #1000 as from research paper
    """
    returns percentile bands for income, spending, and left_over

    """

    income_residuals = income_model["residuals"]
    spending_residuals = spending_model["residuals"]

    #base prediction 
    base_income = predict_income(income_model, hours)

    sim_income = []
    sim_spent = []
    sim_left = []

    for _ in range(n_simulations):

        #one random residual from history for income and spending noise
        u_income = random.choice(income_residuals)
        u_spending = random.choice(spending_residuals)

        #deterministic prediction (from SCM) + the sampled noise
        draw_income = base_income + u_income

        #feeds noisy income through model b to calculate spending (uses ratio fallback if extrapolating)
        if panel is not None and shift_types is not None:
            draw_spent = max(0.0, _predict_spending_safe(spending_model, draw_income, panel, shift_types, hours) + u_spending)
        else:
            draw_spent = max(0.0, predict_spending(spending_model, draw_income) + u_spending) #max to prevent negative spending
        draw_left  = draw_income - draw_spent #amount left after spending

        #stores each value in the list
        sim_income.append(draw_income)
        sim_spent.append(draw_spent)
        sim_left.append(draw_left)


    def _percentiles(data):

        #95% confidence interval
        s = sorted(data)
        n = len(s)
        
        return {
            "p2_5": round(s[int(n * 0.025)], 2),   # lower bound of 95% CI
            "p50":  round(s[int(n * 0.500)], 2),   # median (central estimate)
            "p97_5": round(s[int(n * 0.975)], 2),  # upper bound of 95% CI
        }

    return {
        "income": _percentiles(sim_income),
        "spending": _percentiles(sim_spent),
        "left_over": _percentiles(sim_left),
    }


# HINDSIGHT COUNTERFACTUAL

def counterfactual_hindsight(
    target_month: int,
    target_year: int,
    cf_hours: dict, 
) -> dict:

    """
    returns

    {
        "actual": {
            "income", "total_spent", "left_over",
            "hours": { shift_type: hours, ... }
        },

        "counterfactual": {
            "cf_income", "cf_spent", "cf_left_over"
        },
        "model_fit": { "income_r2", "spending_r2" }
    }
    
    """

    # load and validate panel data
    panel, shift_types = get_monthly_panel()
    check = validate_data_sufficiency(panel, len(shift_types))

    if not check["sufficient"]:
        return {
            "error": (
                f"Need at least {check['minimum_required']} months of history, "
                f"only have {check['months_available']}"
            ),
        }

    # find the target month in the panel
    target = None
    target_idx = None
    for i, r in enumerate(panel):
        if r["month"] == target_month and r["year"] == target_year:
            target = r
            target_idx = i
            break

    if target is None:
        return {
            "error": f"No closed-month data for {target_month:02d}/{target_year}",
        }

    # train both structural equations on full history
    income_model = ols_income_model(panel, shift_types)
    spending_model = ols_spending_model(panel)

    #1. abduction -> fetching the residual for target month (personal gap between actual and predicted)
    residual_income = income_model["residuals"][target_idx]
    residual_spending = spending_model["residuals"][target_idx]

    #2. action -> substitues the values with new counterfactual values 
    cf_income_base = predict_income(income_model, cf_hours)

    #3. prediction -> predicts the outcome of the scenario with counterfactual values 
    cf_income = cf_income_base + residual_income

    cf_spent = _predict_spending_safe(spending_model, cf_income, panel, shift_types, cf_hours) + residual_spending

    cf_spent = max(0.0, cf_spent)

    cf_left_over = cf_income - cf_spent

    actual_left_over = target["income"] - target["total_spent"]


    distribution = monte_carlo(income_model, spending_model, cf_hours, panel, shift_types)

    return {

        "actual": {
            "income": round(target["income"], 2),
            "total_spent": round(target["total_spent"], 2),
            "left_over": round(actual_left_over, 2),
            "hours": target["hours_by_type"],
        },

        "counterfactual": {
            "cf_income": round(cf_income, 2),
            "cf_spent": round(cf_spent, 2),
            "cf_left_over": round(cf_left_over, 2),
        },

        
        "distribution": distribution,

        "model_fit": {
            "income_r2": round(income_model["r_squared"], 4),
            "spending_r2": round(spending_model["r_squared"], 4),
        },
    }


### USE CASE 2 ###

#average of paid fixed costs from history 
def _get_fixed_costs_avg():
    conn = sqlite3.connect(HISTORY_DB)

    result = conn.execute("""
                          
        SELECT AVG(total) FROM (
            SELECT SUM(amount) as total
            FROM fixed_cost_history
            WHERE was_paid = 1
            GROUP BY month, year
        )
                          
    """).fetchone()

    conn.close()
    return round(result[0], 2) if result and result[0] else 0.0

#fetches latest state of savings goals. (converts month into numbers like 202603 to find recent month)
def _get_goal_state():
    
    conn = sqlite3.connect(HISTORY_DB)

    rows = conn.execute("""
        SELECT g.goal_id, g.target_amount, g.amount_at_month_end
        FROM goal_history g
        INNER JOIN (
            SELECT MAX(year * 100 + month) as latest FROM goal_history 
        ) t ON (g.year * 100 + g.month) = t.latest
                        
    """).fetchall()

    conn.close()

    return [
        {"goal_id": r[0], "target": r[1], "current_savings": r[2]}
        for r in rows
    ]


#learns how much of the user's leftover money each month actually goes into savings against how much was available for them to put into savings 
def _compute_savings_rate(panel, fixed_costs):
    total_saved = 0.0
    total_available = 0.0

    for i in range(1, len(panel)):

        #how much savings grew each month
        contribution = panel[i]["savings"] - panel[i - 1]["savings"]

        #how much was available after spending and fixed costs
        available = panel[i]["income"] - panel[i]["total_spent"] - fixed_costs

        total_saved += contribution
        total_available += available

    #ensures result does not go below 0 
    return max(0.0, min(1.0, total_saved / total_available))



def counterfactual_forecasting(
    planned_hours: dict,  
    ) -> dict:

    """
    
    returns

    {
        "baseline": { income, fixed_costs, envelope_spending, available_to_save, goal_contribution, hours },
        "planned":  { "" },
        "goals": [ goal projections ],
        "model_fit": { income_r2, spending_r2 }
    }


    """

    #checks if there is enough data for the model to run 
    panel, shift_types = get_monthly_panel()
    check = validate_data_sufficiency(panel, len(shift_types))

    if not check["sufficient"]:
        return {
            "error": check.get("error",
                f"Need at least {check['minimum_required']} months of history, "
                f"only have {check['months_available']}"
            ),
        }

    #1. Abduction 
    income_model = ols_income_model(panel, shift_types) #finding hourly rate per shift type and the intercept
    spending_model = ols_spending_model(panel) #relationship between income and spending 

    #residual calc for latest month 
    residual_income = income_model["residuals"][-1] 
    residual_spending = spending_model["residuals"][-1]


    #2. Action
    #builds dict of avg hours /shift type across historical months 
    avg_hours = {}
    for t in shift_types:
        avg_hours[t] = round(float(np.mean([r["hours_by_type"].get(t, 0.0) for r in panel])), 1)

    #3. Prediction


    #baseline prediction for income and spending by running through model a and b
    baseline_income = predict_income(income_model, avg_hours) + residual_income
    baseline_spent = max(0.0, _predict_spending_safe(spending_model, baseline_income, panel, shift_types, avg_hours) + residual_spending)

    #predict with user's chosen hours
    planned_income = predict_income(income_model, planned_hours) + residual_income
    planned_spent = max(0.0, _predict_spending_safe(spending_model, planned_income, panel, shift_types, planned_hours) + residual_spending)

    
    fixed_costs = _get_fixed_costs_avg()

    #calculates available money to save 
    baseline_available = baseline_income - baseline_spent - fixed_costs
    planned_available = planned_income - planned_spent - fixed_costs

    #rate of money available going to savings 
    savings_rate = _compute_savings_rate(panel, fixed_costs)

    baseline_goal_contrib = baseline_available * savings_rate
    planned_goal_contrib = planned_available * savings_rate

    goals = _get_goal_state()

    #sums up how much is still needed for each unmet goals
    total_remaining = sum(max(0, g["target"] - g["current_savings"]) for g in goals)



    goal_projections = []

    for g in goals:

        if g["current_savings"] >= g["target"]:
            continue  # skip goals already met

        #how much stiill needed to reach the goal    
        remaining = max(0, g["target"] - g["current_savings"])

        #calculates savings distribution (if a goal has more remaining it will get more money)
        weight = remaining / total_remaining if total_remaining > 0 else 1.0 / max(len(goals), 1)


        #applies calculated weight to each goals actual contribution amount
        b_contrib = baseline_goal_contrib * weight
        p_contrib = planned_goal_contrib * weight



        goal_projections.append({

            "goal_id": g["goal_id"],
            "target": g["target"],
            "current_savings": round(g["current_savings"], 2),
            "baseline_contribution": round(b_contrib, 2),
            "planned_contribution": round(p_contrib, 2),

            #how close to goal after this month's contribution
            "baseline_progress": round((g["current_savings"] + b_contrib) / g["target"] * 100, 1),
            "planned_progress": round((g["current_savings"] + p_contrib) / g["target"] * 100, 1),

        })


    
    planned_distribution = monte_carlo(income_model, spending_model, planned_hours, panel, shift_types)

    return {

        "baseline": {
            "hours": avg_hours,
            "income": round(baseline_income, 2),
            "fixed_costs": round(fixed_costs, 2),
            "envelope_spending": round(baseline_spent, 2),
            "available_to_save": round(baseline_available, 2),
            "goal_contribution": round(baseline_goal_contrib, 2),
        },

        "planned": {
            "hours": {t: planned_hours.get(t, 0.0) for t in shift_types},
            "income": round(planned_income, 2),
            "fixed_costs": round(fixed_costs, 2),
            "envelope_spending": round(planned_spent, 2),
            "available_to_save": round(planned_available, 2),
            "goal_contribution": round(planned_goal_contrib, 2),
        },

      
        "distribution": planned_distribution,

        "goals": goal_projections,

        "model_fit": {
            "income_r2": round(income_model["r_squared"], 4),
            "spending_r2": round(spending_model["r_squared"], 4),
        },

    }
