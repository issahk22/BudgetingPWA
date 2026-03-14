

import numpy as np
from sklearn.linear_model import LinearRegression
from causal_data import get_monthly_panel, validate_data_sufficiency


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

    #1. abduction - fetching the residual for target month (personal gap between actual and predicted)
    residual_income = income_model["residuals"][target_idx]
    residual_spending = spending_model["residuals"][target_idx]

    #2. action -> substitues the values with new counterfactual values 
    cf_income_base = predict_income(income_model, cf_hours)

    #3. prediction -> predicts the outcome of the scenario with counterfactual values 
    cf_income = cf_income_base + residual_income

    cf_spent = predict_spending(spending_model, cf_income) + residual_spending

    cf_spent = max(0.0, cf_spent)

    cf_left_over = cf_income - cf_spent

    actual_left_over = target["income"] - target["total_spent"]

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

        "model_fit": {
            "income_r2": round(income_model["r_squared"], 4),
            "spending_r2": round(spending_model["r_squared"], 4),
        },
    }
