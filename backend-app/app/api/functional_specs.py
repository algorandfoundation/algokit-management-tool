from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.functional_specs.tree import get_functional_specs
from app.utils.storage import save_to_storage

router = APIRouter()


@router.get("/functional_specs", response_model=Dict[str, Any])
async def get_specs():
    """
    Get functional specifications tree from Google Sheets.
    Returns a hierarchical tree structure of specifications.
    """
    try:
        results = get_functional_specs()
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
        outdata = {
            "results": results,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "source": "specs-analyzer",
            },
        }
        cloud_storage_folder = (
            f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/functional_specs"
        )

        save_to_storage(
            outdata, f"{cloud_storage_folder}/latest.json", make_public=True
        )
        save_to_storage(outdata, f"{cloud_storage_folder}/{created_at}.json")
        return outdata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
