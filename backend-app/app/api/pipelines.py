from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.pipelines.github import get_pipeline_status
from app.utils.storage import save_to_storage

router = APIRouter()


@router.get("/pipeline-status", response_model=Dict[str, Any])
async def github_pipeline_status():
    """
    Fetch GitHub Actions pipeline runs for the configured repositories.
    Returns the pipeline status data and saves it to storage.
    """
    try:
        all_runs, start_date_iso, end_date_iso = await get_pipeline_status()

        created_at = datetime.now(UTC).replace(microsecond=0).isoformat() + "Z"
        outdata = {
            "results": all_runs,
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "repository_count": len(settings.REPOSITORIES),
                "source": "github-pipeline-status",
                "run_count": len(all_runs),
                "start_date_iso": start_date_iso,
                "end_date_iso": end_date_iso,
            },
        }

        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/pipeline-runs"
        latest_path = f"{cloud_storage_folder}/latest.json"
        timestamped_path = f"{cloud_storage_folder}/{created_at}.json"

        save_to_storage(outdata, latest_path, make_public=True)
        save_to_storage(outdata, timestamped_path)

        response_data = {
            "message": "Pipeline runs fetched and saved successfully.",
            "run_count": len(all_runs),
            "storage_paths": {
                "latest": f"https://storage.googleapis.com/{settings.GCP_BUCKET_NAME}/{latest_path}",
                "timestamped": f"https://storage.googleapis.com/{settings.GCP_BUCKET_NAME}/{timestamped_path}",
            },
            "data": outdata,
        }
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
