# Fulus

A personal budgeting web app built around envelope budgeting, shift income tracking, and counterfactual financial analysis; targeted at people who work shift based jobs with fluctuating incomes.

**THIS IS A PROTOTYPE**

## Features

- **Envelope budgeting** - allocate income into spending categories each month
- **Shift tracking** - log shifts by job and type, gross predicted income is calculated automatically
- **Savings pots** - set a target and deadline, track progress on dashboard
- **What If analysis** - hindsight counterfactuals and income forecasting using OLS + Monte Carlo simulation
- **Insights** - charts for income vs spending, savings progress, and envelope breakdown

## Tech Stack

**Frontend** - Next.js 16, React 19, Tailwind CSS v4, Recharts  
**Backend** - Python, FastAPI, SQLAlchemy, SQLite  
**ML** - scikit-learn (OLS linear regression), NumPy

## Getting Started

**Backend**

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```


**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`



Onboarding must be completed to run the application. 





## Prototype Notes
As this is still a prototype there are some restrictions so the app does not break.

Only 1 bank account and 1 pot can (and must) be created, the code in the backend supports multiple 
but just for the database integrity and showing all the features this is limited

The shift types must be max 5 but best leave them as the ones pre selected

Envelopes MUST be consistent throughout 6 months to get good outputs from the counterfactual models

Every closed month must have shifts logged.

Shift type names must stay consistent for the machine learning and counterfactual models to work. 


## Project Structure

```
backend/
  config.py
  database.py
  history_database.py
  history_main.py
  history_models.py
  history_schemas.py
  main.py               
  models.py                  
  month_close.py
  schemas.py
  counterfactual/
         casual_data.py
         counterfactual_router.py
         counterfactual.py
  envelope_optimisation/
          envelope_data.py
          envelope_recommender.py
          envelope_router.py


frontend/
  app/
    (main)/
      dashboard/       
      insights/         
      history/         
      whatif/           
    onboarding/         
    lock/        
    components/
    page.js
    layout.js       
```
