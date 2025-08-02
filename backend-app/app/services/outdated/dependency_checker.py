import json
import os
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

from app.core.logging import LoggerFactory

logger = LoggerFactory.get_logger(__name__)


def get_or_clone_repo(repo_url: str, repo_name: str) -> Optional[str]:
    """Get repository from .algokit_repos folder, clone or update as needed."""
    repos_dir = Path(".algokit_repos")
    repos_dir.mkdir(exist_ok=True)
    
    repo_path = repos_dir / repo_name
    
    try:
        if repo_path.exists():
            logger.info(f"🔄 Updating existing repository: {repo_name}")
            
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
            
            logger.info(f"🌿 Checking out {main_branch} branch and pulling latest changes")
            # Checkout main branch and hard pull
            subprocess.run(["git", "checkout", main_branch], cwd=repo_path, check=True, capture_output=True)
            subprocess.run(["git", "fetch", "origin"], cwd=repo_path, check=True, capture_output=True)
            subprocess.run(["git", "reset", "--hard", f"origin/{main_branch}"], cwd=repo_path, check=True, capture_output=True)
            
        else:
            logger.info(f"📥 Cloning fresh repository: {repo_name}")
            subprocess.run(
                ["git", "clone", repo_url, str(repo_path)],
                check=True,
                capture_output=True,
            )
        
        logger.info(f"✅ Repository {repo_name} ready at: {repo_path}")
        return str(repo_path)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Error with repository {repo_name}: {e}")
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
        logger.info(f"🐍 Checking Python dependencies in {repo_path}")
        requirements_file = os.path.join(repo_path, "requirements.txt")
        if os.path.exists(requirements_file):
            logger.info(f"📦 Installing requirements from {requirements_file}")
            subprocess.run(
                ["pip", "install", "-r", requirements_file],
                check=True,
                capture_output=True,
            )
        else:
            logger.info("📦 No requirements.txt found, checking installed packages")

        logger.info("🔍 Running pip list --outdated to check for updates")
        result = subprocess.run(
            ["pip", "list", "--outdated", "--format=json"],
            check=True,
            capture_output=True,
            text=True,
        )
        raw_results = json.loads(result.stdout)
        formatted_results = format_python_outdated_results(raw_results)
        logger.info(f"✅ Found {len(formatted_results)} outdated Python packages")
        return formatted_results
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
        logger.info(f"📦 Checking JavaScript dependencies in {repo_path}")
        package_json_path = os.path.join(repo_path, "package.json")
        if os.path.exists(package_json_path):
            logger.info(f"📦 Installing npm packages from {package_json_path}")
            subprocess.run(
                ["npm", "install", "--yes"], capture_output=True, cwd=repo_path
            )
        else:
            logger.info("📦 No package.json found in repository")

        logger.info("🔍 Running npm outdated to check for updates")
        result = subprocess.run(
            ["npm", "outdated", "--json"],
            capture_output=True,
            text=True,
            cwd=repo_path,
        )
        raw_results = json.loads(result.stdout) if result.stdout else {}
        formatted_results = format_npm_outdated_results(raw_results)
        logger.info(f"✅ Found {len(formatted_results)} outdated JavaScript packages")
        return formatted_results
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
    logger.info(f"🚀 Starting outdated dependency check for {len(repositories)} repositories")
    results = []
    successful_checks = 0
    failed_checks = 0

    for i, repo in enumerate(repositories, 1):
        logger.info(f"[{i}/{len(repositories)}] 🔍 Checking outdated dependencies for {repo['name']} ({repo['language']})")
        repo_result = {
            "name": repo["name"],
            "url": f"https://github.com/{repo['owner']}/{repo['name']}",
            "language": repo["language"],
            "build_name": repo["build_name"],
            "outdated_dependencies": None,
            "error": None,
        }
        repo_url = f"https://github.com/{repo['owner']}/{repo['name']}"
        
        logger.info(f"📂 Getting repository: {repo_url}")
        cloned_path = get_or_clone_repo(repo_url, repo["name"])
        if not cloned_path:
            logger.error(f"❌ Failed to get repository {repo['name']}")
            repo_result["error"] = "Failed to clone repository"
            failed_checks += 1
            results.append(repo_result)
            continue

        logger.info(f"✅ Repository ready at: {cloned_path}")

        if repo["language"].lower() == "python":
            repo_result["outdated_dependencies"] = check_python_outdated(
                cloned_path
            )
        elif repo["language"].lower() == "javascript":
            repo_result["outdated_dependencies"] = check_javascript_outdated(
                cloned_path
            )
        else:
            logger.error(f"❌ Unsupported language: {repo['language']} for {repo['name']}")
            repo_result["error"] = f"Unsupported language: {repo['language']}"
            failed_checks += 1
            results.append(repo_result)
            continue

        if repo_result["outdated_dependencies"] is not None:
            outdated_count = len(repo_result["outdated_dependencies"])
            if outdated_count > 0:
                logger.info(f"📊 {repo['name']}: {outdated_count} outdated dependencies found")
            else:
                logger.info(f"✨ {repo['name']}: All dependencies are up to date!")
            successful_checks += 1
        else:
            logger.error(f"❌ Failed to check dependencies for {repo['name']}")
            failed_checks += 1

        results.append(repo_result)

    # Summary logging
    total_outdated = sum(len(r.get("outdated_dependencies", [])) for r in results if r.get("outdated_dependencies"))
    logger.info("🏁 Dependency check completed!")
    logger.info(f"📈 Summary: {successful_checks} successful, {failed_checks} failed, {total_outdated} total outdated dependencies")

    return results
