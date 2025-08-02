import subprocess
import tempfile
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.core.logging import LoggerFactory
from app.services.changelog.models import GitOperationResult

logger = LoggerFactory.get_logger(__name__)


def clone_repo(repo_url: str, temp_dir: str) -> Optional[str]:
    """Clone a repository into a temporary directory.
    
    Reuses the pattern from dependency_checker.py
    """
    try:
        subprocess.run(
            ["git", "clone", repo_url, temp_dir],
            check=True,
            capture_output=True,
        )
        return temp_dir
    except subprocess.CalledProcessError as e:
        logger.error(f"Error cloning repository {repo_url}: {e}")
        return None


def get_commits_since(repo_path: str, days_back: int = 7) -> List[str]:
    """Get commit hashes from the last N days using git log.
    
    Args:
        repo_path: Path to the git repository
        days_back: Number of days to look back
        
    Returns:
        List of commit hashes
    """
    try:
        since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        result = subprocess.run(
            ["git", "log", f"--since={since_date}", "--pretty=format:%H"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        
        commits = result.stdout.strip().split('\n') if result.stdout.strip() else []
        logger.info(f"Found {len(commits)} commits in the last {days_back} days")
        return commits
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Error getting commits from {repo_path}: {e}")
        return []


def get_commit_messages_since(repo_path: str, days_back: int = 7) -> List[str]:
    """Get commit messages from the last N days.
    
    Args:
        repo_path: Path to the git repository
        days_back: Number of days to look back
        
    Returns:
        List of commit messages with hash
    """
    try:
        since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        result = subprocess.run(
            ["git", "log", f"--since={since_date}", "--pretty=format:%h %s"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        
        messages = result.stdout.strip().split('\n') if result.stdout.strip() else []
        return messages
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Error getting commit messages from {repo_path}: {e}")
        return []


def get_repository_diff(repo_path: str, days_back: int = 7) -> str:
    """Get git diff for changes in the last N days.
    
    Args:
        repo_path: Path to the git repository
        days_back: Number of days to look back
        
    Returns:
        Git diff content as string
    """
    try:
        since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        # Get the oldest commit from the timeframe to use as base
        oldest_commit_result = subprocess.run(
            ["git", "log", f"--since={since_date}", "--pretty=format:%H", "--reverse"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        
        if not oldest_commit_result.stdout.strip():
            logger.info(f"No commits found in the last {days_back} days")
            return ""
            
        oldest_commit = oldest_commit_result.stdout.strip().split('\n')[0]
        
        # Get diff from oldest commit to HEAD
        result = subprocess.run(
            ["git", "diff", f"{oldest_commit}^", "HEAD"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        
        diff_content = result.stdout
        logger.info(f"Generated diff with {len(diff_content)} characters")
        return diff_content
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Error getting diff from {repo_path}: {e}")
        return ""


def get_file_changes_since(repo_path: str, days_back: int = 7) -> List[str]:
    """Get list of files changed in the last N days.
    
    Args:
        repo_path: Path to the git repository
        days_back: Number of days to look back
        
    Returns:
        List of file paths that were changed
    """
    try:
        since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        result = subprocess.run(
            ["git", "log", f"--since={since_date}", "--name-only", "--pretty=format:"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        
        # Filter out empty lines and duplicates
        files = list(set(line.strip() for line in result.stdout.split('\n') if line.strip()))
        return files
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Error getting file changes from {repo_path}: {e}")
        return []


def process_repository_git_data(repo_config: Dict[str, Any], days_back: int = 7) -> GitOperationResult:
    """Process git data for a single repository.
    
    Args:
        repo_config: Repository configuration dict with 'name', 'owner', etc.
        days_back: Number of days to look back
        
    Returns:
        GitOperationResult with all git data or error information
    """
    repo_name = repo_config["name"]
    repo_url = f"https://github.com/{repo_config['owner']}/{repo_name}"
    
    logger.info(f"Processing git data for {repo_name}")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Clone repository
        cloned_path = clone_repo(repo_url, temp_dir)
        if not cloned_path:
            return GitOperationResult(
                repository_name=repo_name,
                success=False,
                commits=[],
                diff_content="",
                error="Failed to clone repository"
            )
        
        # Get commits and diff
        commits = get_commits_since(cloned_path, days_back)
        diff_content = get_repository_diff(cloned_path, days_back)
        
        if not commits and not diff_content:
            return GitOperationResult(
                repository_name=repo_name,
                success=True,
                commits=[],
                diff_content="",
                error=None
            )
        
        return GitOperationResult(
            repository_name=repo_name,
            success=True,
            commits=commits,
            diff_content=diff_content,
            error=None
        ) 