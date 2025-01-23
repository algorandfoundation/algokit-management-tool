from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.dependencies.main import get_dependency_data
from app.utils.storage import save_to_storage

router = APIRouter()


@router.get("/dependencies", response_model=Dict[str, Any])
async def get_dependencies():
    """
    Get current dependencies graph for all repositories.
    Returns nodes and links representing the dependency relationships.
    """
    try:
        dependency_data = get_dependency_data(settings.REPOSITORIES)
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
        outdata = {
            "results": dependency_data,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "repository_count": len(settings.REPOSITORIES),
                "source": "dependency-analyzer",
            },
        }
        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/dependencies"

        save_to_storage(
            outdata, f"{cloud_storage_folder}/latest.json", make_public=True
        )
        save_to_storage(outdata, f"{cloud_storage_folder}/{created_at}.json")
        return outdata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
