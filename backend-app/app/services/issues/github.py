import time
from typing import Any, Dict, List

import requests

from app.core.config import settings
from app.core.logging import LoggerFactory
from app.utils.github import get_github_token

logger = LoggerFactory.get_logger(__name__)


def get_repo_issues(repo_name: str, token: str) -> List[Dict[str, Any]]:
    """Fetch issues for a specific repository."""

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    url = f"https://api.github.com/repos/{settings.GITHUB_ORG}/{repo_name}/issues?state=open"
    all_issues = []
    page = 1

    while True:
        response = requests.get(f"{url}&page={page}", headers=headers)
        if response.status_code != 200:
            logger.error(
                f"Error fetching issues for {settings.GITHUB_ORG}/{repo_name}: {response.status_code}"
            )
            break

        issues = response.json()
        if not issues:
            break

        all_issues.extend(issues)
        page += 1
        # Adding a delay to avoid rate limiting
        time.sleep(1)

    return all_issues


def get_pull_request_details(pull_request_url: str, token: str = None) -> Dict[str, Any]:
    """Fetch detailed information about a pull request."""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    response = requests.get(pull_request_url, headers=headers)
    if response.status_code != 200:
        logger.error(f"Error fetching pull request details: {response.status_code}")
        return {}
    return response.json()


def get_github_issues() -> List[Dict[str, Any]]:
    """
    Cloud Function entry point - triggered by Cloud Scheduler.
    Fetches all issues and saves them to Cloud Storage.
    """
    try:
        # Collect issues from all repositories
        token = get_github_token()
        all_issues = []
        for repo in settings.REPOSITORIES:
            repo_name = repo["name"]
            logger.info(f"Fetching issues for {settings.GITHUB_ORG}/{repo_name}")
            issues = get_repo_issues(repo_name, token)
            for issue in issues:
                is_pull_request = "pull_request" in issue
                pull_request_details = {}
                if is_pull_request:
                    pull_request_details = get_pull_request_details(
                        issue["pull_request"]["url"], token
                    )

                all_issues.append(
                    {
                        "repository": f"{settings.GITHUB_ORG}/{repo_name}",
                        "title": issue["title"],
                        "number": issue["number"],
                        "state": issue["state"],
                        "createdAt": issue["created_at"],
                        "updatedAt": issue["updated_at"],
                        "htmlUrl": issue["html_url"],
                        "labels": [label["name"] for label in issue["labels"]],
                        "assignees": [
                            assignee["login"] for assignee in issue["assignees"]
                        ],
                        "commentsCount": issue["comments"],
                        "isPullRequest": is_pull_request,
                        "author": issue["user"]["login"],
                        "closedAt": issue.get("closed_at"),
                        "pullRequest": {
                            "url": pull_request_details.get("url"),
                            "comments": pull_request_details.get("comments"),
                            "reviewComments": pull_request_details.get(
                                "review_comments"
                            ),
                        }
                        if is_pull_request
                        else None,
                    }
                )

        return all_issues

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"error": str(e)}, 500


if __name__ == "__main__":
    print("Hello World")
