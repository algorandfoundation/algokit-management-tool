from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.releases.github import get_github_releases
from app.utils.storage import save_to_storage

router = APIRouter()


@router.get("/releases", response_model=Dict[str, Any])
async def get_repo_releases():
    """
    Fetch the latest main and beta releases for all configured repositories.
    Returns the latest main release and latest beta release for each repository.
    """
    try:
        results = get_github_releases()
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
        outdata = {
            "results": results,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "repository_count": len(settings.REPOSITORIES),
                "source": "releases-analyzer",
            },
        }

        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/releases"

        save_to_storage(
            outdata, f"{cloud_storage_folder}/latest.json", make_public=True
        )
        save_to_storage(outdata, f"{cloud_storage_folder}/{created_at}.json")
        return outdata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
