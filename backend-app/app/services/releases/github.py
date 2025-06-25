import time
from typing import Any, Dict, List, Optional

import requests

from app.core.config import settings
from app.core.logging import LoggerFactory
from app.utils.github import get_github_token

logger = LoggerFactory.get_logger(__name__)


def get_repo_releases(repo_name: str, token: str) -> List[Dict[str, Any]]:
    """Fetch releases for a specific repository."""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }

    url = f"https://api.github.com/repos/{settings.GITHUB_ORG}/{repo_name}/releases"
    all_releases = []
    page = 1

    while True:
        response = requests.get(f"{url}?page={page}&per_page=100", headers=headers)
        if response.status_code != 200:
            logger.error(
                f"Error fetching releases for {settings.GITHUB_ORG}/{repo_name}: {response.status_code}"
            )
            break

        releases = response.json()
        if not releases:
            break

        all_releases.extend(releases)
        page += 1
        # Adding a delay to avoid rate limiting
        time.sleep(0.5)

    return all_releases


def classify_release(release: Dict[str, Any]) -> str:
    """Classify a release as main or beta based on tag name and prerelease flag."""
    tag_name = release.get("tag_name", "").lower()
    is_prerelease = release.get("prerelease", False)

    # Beta release indicators
    beta_indicators = ["beta", "alpha", "rc", "pre", "dev"]

    if is_prerelease or any(indicator in tag_name for indicator in beta_indicators):
        return "beta"
    else:
        return "main"


def get_latest_releases_for_repo(
    repo_name: str, token: str
) -> Dict[str, Optional[Dict[str, Any]]]:
    """Get the latest main and beta releases for a specific repository."""
    releases = get_repo_releases(repo_name, token)

    # Sort releases by published_at in descending order (newest first) to ensure
    # we get the actual latest releases regardless of API default ordering
    releases.sort(key=lambda r: r.get("published_at", ""), reverse=True)

    latest_main = None
    latest_beta = None

    for release in releases:
        if release.get("draft", False):
            continue  # Skip draft releases

        release_type = classify_release(release)

        if release_type == "main" and latest_main is None:
            latest_main = {
                "tag_name": release["tag_name"],
                "name": release["name"],
                "published_at": release["published_at"],
                "html_url": release["html_url"],
                "prerelease": release["prerelease"],
                "draft": release["draft"],
                "author": release["author"]["login"] if release.get("author") else None,
            }
        elif release_type == "beta" and latest_beta is None:
            latest_beta = {
                "tag_name": release["tag_name"],
                "name": release["name"],
                "published_at": release["published_at"],
                "html_url": release["html_url"],
                "prerelease": release["prerelease"],
                "draft": release["draft"],
                "author": release["author"]["login"] if release.get("author") else None,
            }

        # Break early if we found both
        if latest_main and latest_beta:
            break

    return {"main": latest_main, "beta": latest_beta}


def get_github_releases() -> List[Dict[str, Any]]:
    """
    Fetches the latest main and beta releases from all configured repositories.
    """
    try:
        token = get_github_token()
        all_releases = []

        for repo in settings.REPOSITORIES:
            repo_name = repo["name"]
            logger.info(f"Fetching releases for {settings.GITHUB_ORG}/{repo_name}")

            releases = get_latest_releases_for_repo(repo_name, token)

            repo_releases = {
                "repository": f"{settings.GITHUB_ORG}/{repo_name}",
                "latest_main_release": releases["main"],
                "latest_beta_release": releases["beta"],
            }

            all_releases.append(repo_releases)

        return all_releases

    except Exception as e:
        logger.error(f"Error fetching releases: {str(e)}")
        raise e


if __name__ == "__main__":
    print("Testing releases service...")
    releases = get_github_releases()
    print(f"Found releases for {len(releases)} repositories")
