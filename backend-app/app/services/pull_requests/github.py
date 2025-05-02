import time
from typing import Any, Dict, List

import requests

from app.core.config import settings
from app.core.logging import LoggerFactory
from app.utils.github import get_github_token

logger = LoggerFactory.get_logger(__name__)


def get_repo_pull_requests(repo_name: str, token: str) -> List[Dict[str, Any]]:
    """Fetch pull requests for a specific repository."""

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    url = f"https://api.github.com/repos/{settings.GITHUB_ORG}/{repo_name}/pulls?state=open"
    all_prs = []
    page = 1

    while True:
        response = requests.get(f"{url}&page={page}", headers=headers)
        if response.status_code != 200:
            logger.error(
                f"Error fetching pull requests for {settings.GITHUB_ORG}/{repo_name}: {response.status_code}"
            )
            break

        prs = response.json()
        if not prs:
            break

        all_prs.extend(prs)
        page += 1
        # Adding a delay to avoid rate limiting
        time.sleep(1)

    return all_prs


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
                all_pull_requests.append(
                    {
                        "repository": f"{settings.GITHUB_ORG}/{repo_name}",
                        "title": pr["title"],
                        "number": pr["number"],
                        "state": pr["state"],
                        "createdAt": pr["created_at"],
                        "updatedAt": pr["updated_at"],
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
                    }
                )

        return all_pull_requests

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"error": str(e)}, 500


if __name__ == "__main__":
    print("Hello World") 