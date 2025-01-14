from fastapi import APIRouter, HTTPException
from typing import Dict, Any

# from app.services.github_service import github_issues_sync

router = APIRouter()


@router.get("/github-issues", response_model=Dict[str, Any])
async def get_github_issues():
    """
    Fetch and sync GitHub issues for all configured repositories.
    Returns a summary of the sync operation.
    """
    try:
        # results = github_issues_sync()
        # return results
        return {"results": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
