from datetime import UTC, datetime
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.outdated.dependency_checker import check_outdated_dependencies
from app.utils.storage import save_to_storage

router = APIRouter()


@router.get("/outdated", response_model=Dict[str, Any])
async def check_outdated():
    """
    Check for outdated dependencies in the configured repositories.
    Returns list of outdated dependencies with metadata.
    """
    try:
        results = check_outdated_dependencies(settings.REPOSITORIES)
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
        outdata = {
            "results": results,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "repository_count": len(settings.REPOSITORIES),
                "source": "outdated-analyzer",
            },
        }
        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/outdated"

        save_to_storage(
            outdata, f"{cloud_storage_folder}/latest.json", make_public=True
        )
        save_to_storage(outdata, f"{cloud_storage_folder}/{created_at}.json")
        return outdata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
