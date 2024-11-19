import requests
from typing import Dict, List, Any
import re
import json

from validate import validate
from config import repos
from ingest.python_module import get_node_links_from_python_repo
from ingest.js_package import get_node_links_from_js_repo


def get_repo_contents(repo: Dict[str, Any]) -> List[Dict[str, Any]]:
    organization = re.sub("_", "", repo.get("owner"))
    repo_name = repo.get("name")

    url = f"https://api.github.com/repos/{organization}/{repo_name}/contents"
    if repo.get("branch"):
        url += f"?ref={repo.get('branch')}"
    repo_contents_response = requests.get(url)
    repo_contents = repo_contents_response.json()

    return repo_contents


def get_dep_data_from_repo(repo: Dict[str, Any]) -> Dict[str, Any]:
    repo_contents = get_repo_contents(repo)

    nodes = None
    links = None
    language = repo.get("language")
    if language == "python":
        (nodes, links) = get_node_links_from_python_repo(repo, repo_contents)

    elif language == "javascript":
        (nodes, links) = get_node_links_from_js_repo(repo, repo_contents)

    return (nodes, links)


def main():
    nodes = []
    links = []
    for repo in repos:
        _nodes, _links = get_dep_data_from_repo(repo)
        nodes.extend(_nodes)
        links.extend(_links)

    # with open("dependencies.json", "r") as f:
    #     repo_deps = json.load(f)
    #     nodes = repo_deps.get("nodes")
    #     links = repo_deps.get("links")

    nodes, links = validate({"nodes": nodes, "links": links})
    repo_deps = {"nodes": nodes, "links": links}

    with open("dependencies.json", "w") as f:
        json.dump(repo_deps, f, indent=4)


if __name__ == "__main__":
    main()
