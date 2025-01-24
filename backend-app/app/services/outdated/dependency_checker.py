import json
import os
import subprocess
import tempfile
from typing import Dict, List, Optional

from app.core.logging import LoggerFactory

logger = LoggerFactory.get_logger(__name__)


def clone_repo(repo_url: str, temp_dir: str) -> Optional[str]:
    """Clone a repository into a temporary directory."""
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


def format_python_outdated_results(pip_output: List[Dict]) -> List[Dict]:
    """
    Transform pip outdated JSON output into a simplified list of dependency information.

    Args:
        pip_output: List of dictionaries containing pip outdated command output

    Returns:
        List of dictionaries containing name, current, wanted, and latest versions
    """
    formatted_results = []

    for package in pip_output:
        formatted_results.append(
            {
                "name": package["name"],
                "current": package["version"],
                "wanted": package["latest_version"],
                "latest": package["latest_version"],
            }
        )

    return formatted_results


def check_python_outdated(repo_path: str) -> List[Dict]:
    """Check outdated Python dependencies using pip."""
    try:
        requirements_file = os.path.join(repo_path, "requirements.txt")
        if os.path.exists(requirements_file):
            subprocess.run(
                ["pip", "install", "-r", requirements_file],
                check=True,
                capture_output=True,
            )

        result = subprocess.run(
            ["pip", "list", "--outdated", "--format=json"],
            check=True,
            capture_output=True,
            text=True,
        )
        raw_results = json.loads(result.stdout)
        return format_python_outdated_results(raw_results)
    except subprocess.CalledProcessError as e:
        logger.error(f"Error checking Python dependencies: {e}")
        return []


def format_npm_outdated_results(npm_output: Dict) -> List[Dict]:
    """
    Transform npm outdated JSON output into a simplified list of dependency information.

    Args:
        npm_output: Dictionary containing npm outdated command output

    Returns:
        List of dictionaries containing name, current, wanted, and latest versions
    """
    formatted_results = []

    for package_name, package_info in npm_output.items():
        formatted_results.append(
            {
                "name": package_name,
                "current": package_info["current"],
                "wanted": package_info["wanted"],
                "latest": package_info["latest"],
            }
        )

    return formatted_results


def check_javascript_outdated(repo_path: str) -> Dict:
    """Check outdated JavaScript dependencies using npm."""
    try:
        if os.path.exists(os.path.join(repo_path, "package.json")):
            subprocess.run(
                ["npm", "install", "--yes"], capture_output=True, cwd=repo_path
            )

        result = subprocess.run(
            ["npm", "outdated", "--json"],
            capture_output=True,
            text=True,
            cwd=repo_path,
        )
        raw_results = json.loads(result.stdout) if result.stdout else {}
        return format_npm_outdated_results(raw_results)
    except subprocess.CalledProcessError as e:
        logger.error(f"Error checking JavaScript dependencies: {e}")
        return []


def check_outdated_dependencies(repositories: List[Dict]) -> Dict:
    """
    Check outdated dependencies for multiple repositories.

    Expected input format:
    [
        {
            "name": "repo-name",
            "owner": "organization-name",
            "build_name": "package-name",
            "language": "python",
        },
        {
            "name": "another-repo",
            "owner": "organization-name",
            "build_name": "@org/package-name",
            "language": "javascript",
            "branch": "main"  # optional
        }
    ]
    """
    results = []

    for repo in repositories:
        logger.info(f"Checking outdated dependencies for {repo['name']}")
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_result = {
                "name": repo["name"],
                "url": f"https://github.com/{repo['owner']}/{repo['name']}",
                "language": repo["language"],
                "build_name": repo["build_name"],
                "outdated_dependencies": None,
                "error": None,
            }
            repo_url = f"https://github.com/{repo['owner']}/{repo['name']}"
            cloned_path = clone_repo(repo_url, temp_dir)
            if not cloned_path:
                repo_result["error"] = "Failed to clone repository"
                results.append(repo_result)
                continue

            if repo["language"].lower() == "python":
                repo_result["outdated_dependencies"] = check_python_outdated(
                    cloned_path
                )
            elif repo["language"].lower() == "javascript":
                repo_result["outdated_dependencies"] = check_javascript_outdated(
                    cloned_path
                )
            else:
                repo_result["error"] = f"Unsupported language: {repo['language']}"

            results.append(repo_result)

    return results
