# backend-app/app/api/slack.py
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.services.slack.integrator import post_to_slack

router = APIRouter()


@router.get("/slack/repository-summary", response_model=Dict[str, Any])
async def post_repository_summary_to_slack():
    """
    Generate a summary of repository data and post it to Slack.
    Combines data from multiple endpoints: outdated, pipelines, pull requests, and issues.
    """
    try:
        result = post_to_slack()
        if not result.get("success", False):
            raise HTTPException(
                status_code=500, detail=result.get("message", "Failed to post to Slack")
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
