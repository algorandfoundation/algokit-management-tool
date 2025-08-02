from typing import List, Optional, Dict, Any
from datetime import datetime

from pydantic import BaseModel, Field


class ChangelogEntry(BaseModel):
    """Individual change entry in a changelog."""
    category: str = Field(
        description="Category: Features, Bug Fixes, Breaking Changes, Documentation, etc."
    )
    description: str = Field(description="Brief description of the change")
    files_affected: List[str] = Field(description="List of files modified")
    impact: str = Field(description="Low/Medium/High impact level")


class RepositoryChangelog(BaseModel):
    """Changelog for a single repository."""
    repository_name: str = Field(description="Name of the repository")
    version: Optional[str] = Field(description="Version number if available", default=None)
    release_notes: str = Field(description="Overall summary of changes")
    changes: List[ChangelogEntry] = Field(description="List of individual changes")
    breaking_changes: bool = Field(description="Whether there are breaking changes")
    days_back: int = Field(description="Number of days of changes included")
    commit_count: int = Field(description="Number of commits processed")


# API Request/Response Models
class ChangelogRequest(BaseModel):
    """Request model for changelog generation."""
    days_back: int = Field(
        default=7, 
        ge=1, 
        le=90, 
        description="Number of days to look back for changes (1-90 days)"
    )
    repositories: Optional[List[str]] = Field(
        default=None,
        description="Optional list of repository names to process. If None, processes all configured repositories"
    )


class ChangelogResponse(BaseModel):
    """Response model for changelog generation."""
    message: str = Field(description="Status message")
    repositories_processed: int = Field(description="Number of repositories successfully processed")
    days_back: int = Field(description="Number of days processed")
    storage_paths: Dict[str, str] = Field(description="Storage paths for generated files")
    data: Dict[str, Any] = Field(description="Generated changelog data and metadata")


class ChangelogMetadata(BaseModel):
    """Metadata for changelog generation."""
    created_at: str = Field(description="ISO timestamp of generation")
    version: str = Field(description="API version")
    days_back: int = Field(description="Days processed")
    repositories_processed: int = Field(description="Number of repositories processed")
    source: str = Field(default="changelog-generator", description="Source identifier")
    total_commits: int = Field(description="Total commits across all repositories")
    total_changes: int = Field(description="Total changes identified")


class GitOperationResult(BaseModel):
    """Result of git operations on a repository."""
    repository_name: str = Field(description="Name of the repository")
    success: bool = Field(description="Whether the operation was successful")
    commits: List[str] = Field(description="List of commit hashes")
    diff_content: str = Field(description="Git diff content")
    error: Optional[str] = Field(default=None, description="Error message if operation failed") 