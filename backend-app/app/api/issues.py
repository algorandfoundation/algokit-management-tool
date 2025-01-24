from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.issues.github import get_github_issues
from app.utils.storage import save_to_storage

router = APIRouter()


@router.get("/issues", response_model=Dict[str, Any])
async def get_repo_issues():
    """
    Fetch and sync repo issues for all configured repositories.
    Returns a summary of the sync operation.
    """
    try:
        results = get_github_issues()
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
        outdata = {
            "results": results,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "repository_count": len(settings.REPOSITORIES),
                "source": "issues-analyzer",
            },
        }

        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/issues"

        save_to_storage(
            outdata, f"{cloud_storage_folder}/latest.json", make_public=True
        )
        save_to_storage(outdata, f"{cloud_storage_folder}/{created_at}.json")
        return outdata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
