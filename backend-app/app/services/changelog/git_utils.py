import subprocess
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path

from app.core.logging import LoggerFactory
from app.services.changelog.models import GitOperationResult

logger = LoggerFactory.get_logger(__name__)


def get_repository_filter_patterns(repo_name: Optional[str]) -> tuple[list[str], str]:
    """Get repository-specific filter patterns for git operations.
    
    Args:
        repo_name: Name of the repository
        
    Returns:
        Tuple of (filter_patterns, description) for the repository
    """
    if not repo_name:
        return [], ""
    
    # Common binary file patterns to exclude from all repositories
    binary_patterns = [
        ":!*.png", ":!*.jpg", ":!*.jpeg", ":!*.gif", ":!*.bmp", ":!*.pdf", 
        ":!*.zip", ":!*.tar", ":!*.gz", ":!*.wasm", ":!*.bin", ":!*.exe", 
        ":!*.dll", ":!*.so", ":!*.dylib", ":!*.ico", ":!*.tiff", ":!*.svg"
    ]
    
    repo_lower = repo_name.lower()
    
    if repo_lower == "puya":
        patterns = [
            "--", 
            ":!*.log", ":!**/out/", ":!*.puya.map", ":!*.stats.txt", ":!*.teal", ":!*.arc32.json",
            ":!examples/*", ":!tests/*", ":!test_cases/*"
        ] + binary_patterns
        description = "excluding logs, outputs, examples, tests, binaries, and generated files"
        return patterns, description
    
    elif repo_lower == "algokit-templates":
        patterns = ["--", ":!examples/*"] + binary_patterns
        description = "excluding examples/* and binary files"
        return patterns, description
    
    else:
        # Apply binary filtering to all other repositories
        patterns = ["--"] + binary_patterns
        description = "excluding binary files"
        return patterns, description


def get_or_clone_repo(repo_url: str, repo_name: str) -> Optional[str]:
    """Get repository from .algokit_repos folder, clone or update as needed."""
    repos_dir = Path(".algokit_repos")
    repos_dir.mkdir(exist_ok=True)
    
    repo_path = repos_dir / repo_name
    
    try:
        if repo_path.exists():
            logger.info(f"Updating existing repository: {repo_name}")
            
            # Determine main branch (main vs master)
            try:
                result = subprocess.run(
                    ["git", "symbolic-ref", "refs/remotes/origin/HEAD"],
                    cwd=repo_path,
                    capture_output=True, text=True, check=False
                )
                main_branch = result.stdout.strip().split('/')[-1] if result.returncode == 0 else "main"
            except:
                main_branch = "main"
            
            # Checkout main branch and hard pull
            subprocess.run(["git", "checkout", main_branch], cwd=repo_path, check=True, capture_output=True)
            subprocess.run(["git", "fetch", "origin"], cwd=repo_path, check=True, capture_output=True)
            subprocess.run(["git", "reset", "--hard", f"origin/{main_branch}"], cwd=repo_path, check=True, capture_output=True)
            
        else:
            logger.info(f"Cloning fresh repository: {repo_name}")
            subprocess.run(
                ["git", "clone", repo_url, str(repo_path)],
                check=True,
                capture_output=True,
            )
        
        return str(repo_path)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Error with repository {repo_name}: {e}")
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


def get_repository_diff(repo_path: str, days_back: int = 7, repo_name: Optional[str] = None) -> str:
    """Get git diff for changes in the last N days.
    
    Args:
        repo_path: Path to the git repository
        days_back: Number of days to look back
        repo_name: Name of the repository (used for special filtering)
        
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
        
        # Build git diff command with optional file filtering
        diff_cmd = ["git", "diff", f"{oldest_commit}^", "HEAD"]
        
        # Apply repository-specific filtering
        filter_patterns, filter_description = get_repository_filter_patterns(repo_name)
        if filter_patterns:
            diff_cmd.extend(filter_patterns)
            logger.info(f"Applying file filtering for {repo_name} repository ({filter_description})")
        
        # Get diff from oldest commit to HEAD
        result = subprocess.run(
            diff_cmd,
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


def get_detailed_git_log(repo_path: str, days_back: int = 7, repo_name: Optional[str] = None) -> str:
    """Get detailed git log for changes in the last N days.
    
    Args:
        repo_path: Path to the git repository
        days_back: Number of days to look back
        repo_name: Name of the repository (used for special filtering)
        
    Returns:
        Git log content as string with full commit details
    """
    try:
        since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        # Build git log command with optional file filtering
        log_cmd = ["git", "log", f"--since={since_date}", "--pretty=format:%H%n%an <%ae>%n%ad%n%s%n%b%n---"]
        
        # Apply repository-specific filtering
        filter_patterns, filter_description = get_repository_filter_patterns(repo_name)
        if filter_patterns:
            log_cmd.extend(filter_patterns)
            logger.info(f"Applying file filtering for {repo_name} git log ({filter_description})")
        
        result = subprocess.run(
            log_cmd,
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        
        log_content = result.stdout
        logger.info(f"Generated git log with {len(log_content)} characters")
        return log_content
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Error getting git log from {repo_path}: {e}")
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
    
    # Get or clone repository
    repo_path = get_or_clone_repo(repo_url, repo_name)
    if not repo_path:
        return GitOperationResult(
            repository_name=repo_name,
            success=False,
            commits=[],
            diff_content="",
            git_log="",
            error="Failed to get repository"
        )

    # Get commits, diff, and log
    commits = get_commits_since(repo_path, days_back)
    diff_content = get_repository_diff(repo_path, days_back, repo_name)
    git_log = get_detailed_git_log(repo_path, days_back, repo_name)
    
    if not commits and not diff_content:
        return GitOperationResult(
            repository_name=repo_name,
            success=True,
            commits=[],
            diff_content="",
            git_log="",
            error=None
        )
    
    return GitOperationResult(
        repository_name=repo_name,
        success=True,
        commits=commits,
        diff_content=diff_content,
        git_log=git_log,
        error=None
    ) 