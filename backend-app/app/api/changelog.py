from datetime import UTC, datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.changelog.models import ChangelogRequest
from app.services.changelog.generator import MultiRepoChangelogGenerator
from app.utils.storage import save_to_storage

router = APIRouter()


@router.post("/changelog/generate", response_model=Dict[str, Any])
async def generate_changelog(request: ChangelogRequest):
    """
    Generate changelog for configured repositories based on git changes.
    
    Args:
        request: ChangelogRequest with days_back and optional repository filtering
        
    Returns:
        Generated changelog with structured data and markdown format
    """
    try:
        # Filter repositories if specific ones are requested
        repositories_to_process = settings.REPOSITORIES
        if request.repositories:
            # Filter to only requested repositories
            repo_names = set(request.repositories)
            repositories_to_process = [
                repo for repo in settings.REPOSITORIES 
                if repo["name"] in repo_names
            ]
            
            # Check if all requested repositories exist
            found_names = {repo["name"] for repo in repositories_to_process}
            missing = repo_names - found_names
            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Repository(s) not found in configuration: {', '.join(missing)}"
                )
        
        if not repositories_to_process:
            raise HTTPException(
                status_code=400,
                detail="No repositories to process"
            )
        
        # Generate changelog
        generator = MultiRepoChangelogGenerator()
        result = await generator.generate_multi_repo_changelog(
            repositories=repositories_to_process,
            days_back=request.days_back
        )
        
        if result["status"] != "success":
            raise HTTPException(
                status_code=500,
                detail=f"Changelog generation failed: {result['message']}"
            )
        
        # Prepare output data following existing pattern
        created_at = datetime.now(UTC).replace(microsecond=0).isoformat() + "Z"
        outdata = {
            "results": result["changelogs"],
            "markdown": result["markdown"],
            "failed_repositories": result.get("failed_repositories", []),
            "metadata": {
                "created_at": created_at,
                "version": settings.VERSION,
                "days_back": request.days_back,
                "repository_count": len(repositories_to_process),
                "repositories_processed": result["repositories_processed"],
                "source": "changelog-generator",
                "total_commits": result["metadata"]["total_commits"],
                "total_changes": result["metadata"]["total_changes"],
            },
        }
        
        # Save to cloud storage following existing pattern
        cloud_storage_folder = f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/changelog"
        latest_path = f"{cloud_storage_folder}/latest.json"
        timestamped_path = f"{cloud_storage_folder}/{created_at}.json"
        
        save_to_storage(outdata, latest_path, make_public=True)
        save_to_storage(outdata, timestamped_path)
        
        # Prepare response following existing pattern
        response_data = {
            "message": "Changelog generated successfully",
            "repositories_processed": result["repositories_processed"],
            "days_back": request.days_back,
            "failed_repositories": len(result.get("failed_repositories", [])),
            "storage_paths": {
                "latest": f"https://storage.googleapis.com/{settings.GCP_BUCKET_NAME}/{latest_path}",
                "timestamped": f"https://storage.googleapis.com/{settings.GCP_BUCKET_NAME}/{timestamped_path}",
            },
            "data": outdata,
        }
        
        return response_data
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log and convert other exceptions to HTTP errors
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f"Unexpected error in changelog generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/changelog/status")
async def get_changelog_status():
    """
    Get status information about changelog generation capabilities.
    
    Returns basic information about configured repositories and settings.
    """
    try:
        return {
            "message": "Changelog service is available",
            "configured_repositories": len(settings.REPOSITORIES),
            "repository_names": [repo["name"] for repo in settings.REPOSITORIES],
            "default_days_back": 7,
            "max_days_back": 90,
            "ai_model": "google-gla:gemini-2.0-flash-exp",
            "version": settings.VERSION
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 