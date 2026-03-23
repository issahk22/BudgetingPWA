import numpy as np
from sklearn.linear_model import LinearRegression
from scipy.optimize import minimize
from envelope_data import get_envelope_panel, validate_envelope_data

#trains 1 OLS model / envelope, returnes intercept, coefficient and R^2
def ols_envelope_models(panel, envelope_names):
    
    #2d matrix for ML model with income as the one feature
    X = np.array([[r["income"]] for r in panel])

    models = {}

    for name in envelope_names:

        #actual spending in envelope in that month, separate 1D array
        y = np.array([r["envelope_spending"].get(name, 0.0) for r in panel])

        #trains the model, line of best fit for income and spending 
        reg = LinearRegression().fit(X, y)

        models[name] = {
            "intercept": reg.intercept_, #base spending no matter the income
            "coefficient": reg.coef_[0],  #how much spending changes in the envelope per £1 income goes up
            "r_squared": reg.score(X, y), #how well the line fits the data
        }

    return models



#given income, predicts the natural spending of an envelope 
def predict_envelope_spending(models, income):
   
    predictions = {}

    for name, m in models.items():

        # ŷ = β₀ + β₁ * income
        pred = m["intercept"] + m["coefficient"] * income
        predictions[name] = max(0.0, pred)  #prevents negative spending

    return predictions




#fitting natural spending patterns within actual given budget 
def optimise_allocations(predictions, disposable_budget):
   
    names = list(predictions.keys())
    predicted_values = np.array([predictions[n] for n in names])

    # if predictions already fit within budget, no optimisation needed
    # n = envelope name, v= predicted amount
    if sum(predicted_values) <= disposable_budget:
        return {n: round(float(v), 2) 
                for n, v in zip(names, predicted_values)}

    n = len(names)

    #objective function
    def objective(x):
        return float(np.sum((x - predicted_values) ** 2)) # sum of square difference between allocation and natural prediction

    #gradient function, for 
    def gradient(x):
        return 2.0 * (x - predicted_values)

    #constraint = total allocations must not exceed budget
    constraints = [{
        "type": "ineq",
        "fun": lambda x: disposable_budget - np.sum(x),
    }]

    #bounds = each allocation must be non-negative
    bounds = [(0.0, None) for _ in range(n)]

    #starting point
    scale = disposable_budget / sum(predicted_values) #amount to shrink to fit budget
    x0 = predicted_values * scale #apply to all envelopes

    result = minimize(
        objective,
        x0,
        jac=gradient,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
    )

    return {n: round(float(v), 2) for n, v in zip(names, result.x)}




def recommend_envelopes(income, fixed_costs, goal_contribution):

    """
    
    1. Loads historical envelope data
    2. Validate data sufficiency
    3. Train OLS per envelope
    4. Predict natural spending
    5. Optimise allocations within  budget

    Returns {
        "recommendations": {envelope_name: amount, ...},
        "disposable_budget": float,
        "model_fit": {envelope_name: r_squared, ...},
    }

    """

    panel, envelope_names = get_envelope_panel()
    check = validate_envelope_data(panel, len(envelope_names))

    if not check["sufficient"]:
        return {
            "error": check.get("error",
                f"{check['minimum_required']} required, "
                f"Only {check['months_available']} available"
            ),
        }

    disposable_budget = income - fixed_costs - goal_contribution

    if disposable_budget <= 0:
        return {
            "error": "No disposable budget remaining after fixed costs and goal contributions.",
        }

    #trains one model / envelope
    models = ols_envelope_models(panel, envelope_names)

    #predicts what the user would naturally spend per envelope at this income
    predictions = predict_envelope_spending(models, income)

    #optimise allocations to fit within the disposable budget
    recommendations = optimise_allocations(predictions, disposable_budget)

    return {

        "recommendations": recommendations,
        "disposable_budget": round(disposable_budget, 2),
        "total_allocated": round(sum(recommendations.values()), 2),
        "model_fit": {
            name: round(models[name]["r_squared"], 4) for name in envelope_names

        },
    }
