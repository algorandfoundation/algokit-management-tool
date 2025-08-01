from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.pull_requests.github import get_github_pull_requests, get_closed_pull_requests
from app.utils.storage import save_to_storage

router = APIRouter()


@router.get("/pull-requests", response_model=Dict[str, Any])
async def get_repo_pull_requests():
    """
    Fetch and sync pull requests for all configured repositories.
    Returns a summary of the sync operation.
    """
    try:
        results = get_github_pull_requests()
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
        outdata = {
            "results": results,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "repository_count": len(settings.REPOSITORIES),
                "source": "pull-requests-analyzer",
            },
        }

        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/pull-requests"

        save_to_storage(
            outdata, f"{cloud_storage_folder}/latest.json", make_public=True
        )
        save_to_storage(outdata, f"{cloud_storage_folder}/{created_at}.json")
        return outdata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pull-requests/closed", response_model=Dict[str, Any])
async def get_closed_repo_pull_requests(days_back: int = 1):
    """
    Fetch closed pull requests for all configured repositories.
    
    Args:
        days_back: Number of days to look back for closed PRs (default: 1)
    
    Returns:
        A summary of closed PRs with metadata.
    """
    try:
        results = get_closed_pull_requests(days_back=days_back)
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
        
        outdata = {
            "results": results,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "repository_count": len(settings.REPOSITORIES),
                "source": "pull-requests-analyzer",
                "days_back": days_back,
                "pr_count": len(results),
            },
        }

        # Save to metrics folder structure as requested
        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/metrics/pull_request"
        
        save_to_storage(
            outdata, f"{cloud_storage_folder}/closed_prs.json", make_public=True
        )
        
        return outdata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 