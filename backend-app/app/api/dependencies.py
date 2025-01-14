from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime, UTC

from app.services.dependencies.main import get_dependency_data
from app.config import settings
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
        nodes = dependency_data.get("nodes")
        links = dependency_data.get("links")
        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/dependencies"

        timestamp = datetime.now(UTC).replace(microsecond=0).isoformat()
        save_to_storage(dependency_data, f"{cloud_storage_folder}/latest.json")
        save_to_storage(dependency_data, f"{cloud_storage_folder}/{timestamp}.json")
        return {"nodes": nodes, "links": links}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
