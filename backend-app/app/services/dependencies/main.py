import json
import re
from typing import Any, Dict, List

import requests

from app.core.config import REPOSITORIES
from app.core.logging import LoggerFactory
from app.services.dependencies.validate import validate
from app.utils.github import get_github_token

from .js_package import get_node_links_from_js_repo
from .python_module import get_node_links_from_python_repo

logger = LoggerFactory.get_logger(__name__)


def get_repo_contents(repo: Dict[str, Any]) -> List[Dict[str, Any]]:
    organization = re.sub("_", "", repo.get("owner"))
    repo_name = repo.get("name")
    
    logger.info(f"📂 Fetching repository contents for {organization}/{repo_name}")

    token = get_github_token()
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }

    url = f"https://api.github.com/repos/{organization}/{repo_name}/contents"
    if repo.get("branch"):
        url += f"?ref={repo.get('branch')}"
        logger.info(f"🌿 Using branch: {repo.get('branch')}")
    
    logger.info(f"🌐 Making API request to: {url}")
    repo_contents_response = requests.get(url, headers=headers)
    
    if repo_contents_response.status_code != 200:
        logger.error(f"❌ Failed to fetch contents for {organization}/{repo_name}: {repo_contents_response.status_code}")
        return []
    
    repo_contents = repo_contents_response.json()
    logger.info(f"✅ Successfully fetched {len(repo_contents)} items from {organization}/{repo_name}")

    return repo_contents


def get_dep_data_from_repo(repo: Dict[str, Any]) -> Dict[str, Any]:
    repo_name = repo.get("name", "unknown")
    language = repo.get("language")
    
    logger.info(f"🔍 Processing dependencies for {repo_name} ({language})")
    
    repo_contents = get_repo_contents(repo)
    if not repo_contents:
        logger.error(f"❌ No repository contents available for {repo_name}")
        return (None, None)

    nodes = None
    links = None
    
    if language == "python":
        logger.info(f"🐍 Processing Python dependencies for {repo_name}")
        (nodes, links) = get_node_links_from_python_repo(repo, repo_contents)

    elif language == "javascript":
        logger.info(f"📦 Processing JavaScript dependencies for {repo_name}")
        (nodes, links) = get_node_links_from_js_repo(repo, repo_contents)
    
    else:
        logger.error(f"⚠️  Unsupported language: {language} for {repo_name}")
        return (None, None)

    if nodes and links:
        logger.info(f"✅ Successfully processed {repo_name}: {len(nodes)} nodes, {len(links)} links")
    else:
        logger.warning(f"⚠️  No dependencies found for {repo_name}")

    return (nodes, links)


def get_dependency_data(repos: List[Dict[str, Any]]) -> Dict[str, Any]:
    logger.info(f"🚀 Starting dependency analysis for {len(repos)} repositories")
    
    nodes = []
    links = []
    successful_repos = 0
    failed_repos = 0
    
    for i, repo in enumerate(repos, 1):
        repo_name = repo.get("name", "unknown")
        logger.info(f"[{i}/{len(repos)}] Processing {repo_name}")
        
        _nodes, _links = get_dep_data_from_repo(repo)
        
        if _nodes and _links:
            nodes.extend(_nodes)
            links.extend(_links)
            successful_repos += 1
        else:
            logger.warning(f"⚠️  Failed to process dependencies for {repo_name}")
            failed_repos += 1

    logger.info(f"📊 Pre-validation: {len(nodes)} total nodes, {len(links)} total links")
    
    logger.info("🔍 Validating and cleaning dependency data...")
    nodes, links = validate({"nodes": nodes, "links": links})
    
    logger.info("🏁 Dependency analysis completed!")
    logger.info(f"📈 Summary: {successful_repos} successful, {failed_repos} failed repositories")
    logger.info(f"📊 Final result: {len(nodes)} nodes, {len(links)} links")
    
    return {"nodes": nodes, "links": links}


if __name__ == "__main__":
    logger.info("🎯 Running dependency analysis script...")
    repo_deps = get_dependency_data(REPOSITORIES)
    
    logger.info("💾 Writing results to dependencies.json...")
    with open("dependencies.json", "w") as f:
        json.dump(repo_deps, f, indent=4)
    
    logger.info("✅ Script completed successfully!")
