from fastapi import APIRouter
from pydantic import BaseModel
from envelope_recommender import recommend_envelopes

router = APIRouter(prefix="/envelopes")


class RecommendationRequest(BaseModel):
    income: float
    fixed_costs: float
    goal_contribution: float


@router.post("/recommendations")
def get_recommendations(request: RecommendationRequest):
    return recommend_envelopes(
        income=request.income,
        fixed_costs=request.fixed_costs,
        goal_contribution=request.goal_contribution,
    )
