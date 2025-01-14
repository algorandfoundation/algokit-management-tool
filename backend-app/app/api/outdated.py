from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

# from app.services.outdated_service import check_outdated_dependencies

router = APIRouter()


class Repository(BaseModel):
    name: str
    url: str
    language: str


@router.post("/outdated", response_model=Dict[str, Any])
async def check_outdated(repositories: List[Repository]):
    """
    Check for outdated dependencies in the provided repositories.
    """
    try:
        # results = check_outdated_dependencies([repo.dict() for repo in repositories])
        # return results
        return {"results": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
