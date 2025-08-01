import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests

from app.core.config import settings
from app.core.logging import LoggerFactory
from app.utils.github import get_github_token

logger = LoggerFactory.get_logger(__name__)


def get_repo_pull_requests(repo_name: str, token: str, state: str = "open", since: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch pull requests for a specific repository.
    
    Args:
        repo_name: The repository name
        token: GitHub access token
        state: State of PRs to fetch (open, closed, all)
        since: ISO 8601 format date string to filter PRs updated after this date
    """

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    url = f"https://api.github.com/repos/{settings.GITHUB_ORG}/{repo_name}/pulls"
    params = {"state": state}
    
    # Add time filter for closed PRs
    if since:
        params["sort"] = "updated"
        params["direction"] = "desc"
    
    all_prs = []
    page = 1

    while True:
        params["page"] = page
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            logger.error(
                f"Error fetching pull requests for {settings.GITHUB_ORG}/{repo_name}: {response.status_code}"
            )
            break

        prs = response.json()
        if not prs:
            break

        # If we have a since filter, filter PRs by updated_at or closed_at
        if since:
            since_date = datetime.fromisoformat(since.replace('Z', '+00:00'))
            filtered_prs = []
            for pr in prs:
                # Check if PR was closed after the since date
                if pr.get("closed_at"):
                    closed_date = datetime.fromisoformat(pr["closed_at"].replace('Z', '+00:00'))
                    if closed_date >= since_date:
                        filtered_prs.append(pr)
                    else:
                        # Since results are sorted by updated desc, we can break here
                        all_prs.extend(filtered_prs)
                        return all_prs
            prs = filtered_prs

        all_prs.extend(prs)
        page += 1
        # Adding a delay to avoid rate limiting
        time.sleep(1)

    return all_prs


def format_pr_data(pr: Dict[str, Any], repo_name: str) -> Dict[str, Any]:
    """Format PR data with enhanced fields including merge status and dependabot flag."""
    return {
        "repository": f"{settings.GITHUB_ORG}/{repo_name}",
        "title": pr["title"],
        "number": pr["number"],
        "state": pr["state"],
        "createdAt": pr["created_at"],
        "updatedAt": pr["updated_at"],
        "closedAt": pr.get("closed_at"),
        "htmlUrl": pr["html_url"],
        "labels": [label["name"] for label in pr.get("labels", [])],
        "assignees": [
            assignee["login"] for assignee in pr.get("assignees", [])
        ],
        "reviewers": [
            reviewer["login"] for reviewer in pr.get("requested_reviewers", [])
        ],
        "commentsCount": pr.get("comments", 0),
        "author": pr["user"]["login"],
        "branch": pr["head"]["ref"],
        "mergeable": pr.get("mergeable"),
        "draft": pr.get("draft", False),
        "merged": pr.get("merged", False),
        "mergedAt": pr.get("merged_at"),
        "mergedBy": pr.get("merged_by", {}).get("login") if pr.get("merged_by") else None,
        "isDependabot": pr["user"]["login"] == "dependabot[bot]",
    }


def get_github_pull_requests() -> List[Dict[str, Any]]:
    """
    Fetches all pull requests from the configured repositories.
    """
    try:
        # Collect pull requests from all repositories
        token = get_github_token()
        all_pull_requests = []
        for repo in settings.REPOSITORIES:
            repo_name = repo["name"]
            logger.info(f"Fetching pull requests for {settings.GITHUB_ORG}/{repo_name}")
            pull_requests = get_repo_pull_requests(repo_name, token)
            for pr in pull_requests:
                all_pull_requests.append(format_pr_data(pr, repo_name))

        return all_pull_requests

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"error": str(e)}, 500


def get_closed_pull_requests(days_back: int = 1) -> List[Dict[str, Any]]:
    """
    Fetches all closed pull requests from the configured repositories within the specified time period.
    
    Args:
        days_back: Number of days to look back for closed PRs (default: 1)
    
    Returns:
        List of closed PR data with enhanced fields
    """
    try:
        # Calculate the since date
        since_date = (datetime.now(timezone.utc) - timedelta(days=days_back)).isoformat().replace('+00:00', 'Z')
        
        token = get_github_token()
        all_closed_prs = []
        
        for repo in settings.REPOSITORIES:
            repo_name = repo["name"]
            logger.info(f"Fetching closed pull requests for {settings.GITHUB_ORG}/{repo_name} since {since_date}")
            
            # Fetch closed PRs
            closed_prs = get_repo_pull_requests(repo_name, token, state="closed", since=since_date)
            
            for pr in closed_prs:
                # Only include PRs that were actually closed within our time window
                if pr.get("closed_at"):
                    closed_date = datetime.fromisoformat(pr["closed_at"].replace('Z', '+00:00'))
                    since_datetime = datetime.fromisoformat(since_date.replace('Z', '+00:00'))
                    if closed_date >= since_datetime:
                        all_closed_prs.append(format_pr_data(pr, repo_name))
        
        logger.info(f"Found {len(all_closed_prs)} closed PRs in the past {days_back} day(s)")
        return all_closed_prs
    
    except Exception as e:
        logger.error(f"Error fetching closed pull requests: {str(e)}")
        return []


if __name__ == "__main__":
    print("Hello World") 