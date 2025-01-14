import requests
from typing import List, Dict, Tuple, Any
from .utils import get_node_name, get_package_owner


def get_node_links_from_js_deps(
    input_dict: Dict[str, str], node_data: Dict, link_data: Dict, repo: Dict
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    if input_dict is None or len(input_dict) == 0:
        return ([], [])
    repo_node_name = get_node_name(repo)

    nodes = [
        {
            "id": f"{name}-{repo.get('language')}",
            "name": name,
            "version": [version],
            "owner": get_package_owner(name),
            **node_data,
        }
        for name, version in input_dict.items()
    ]
    links = [
        {
            "source": f"{name}-{repo.get('language')}",
            "target": repo_node_name,
            **link_data,
        }
        for name, _ in input_dict.items()
    ]

    return (nodes, links)


def get_node_links_from_js_repo(
    repo: Dict, repo_contents: List[Dict]
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    graph_kwargs = {"language": "javascript"}
    package_json = [item for item in repo_contents if item["name"] == "package.json"]
    repo_node = {
        "id": get_node_name(repo),
        "name": get_node_name(repo),
        "owner": repo.get("owner"),
        "language": repo.get("language"),
        "type": "dependency",
    }

    if len(package_json) > 0:
        package_json_url = package_json[0]["download_url"]
        package_json_response = requests.get(package_json_url)
        package_json_data = package_json_response.json()
        repo_node["version"] = [package_json_data.get("version")]
        (dependencies_nodes, dependencies_links) = get_node_links_from_js_deps(
            package_json_data.get("dependencies"),
            {"type": "dependency", **graph_kwargs},
            {"type": "dependency", **graph_kwargs},
            repo,
        )
        (dev_dependencies_nodes, dev_dependencies_links) = get_node_links_from_js_deps(
            package_json_data.get("devDependencies"),
            {"type": "dev-dependency", **graph_kwargs},
            {"type": "dev-dependency", **graph_kwargs},
            repo,
        )
        (peer_dependencies_nodes, peer_dependencies_links) = (
            get_node_links_from_js_deps(
                package_json_data.get("peerDependencies"),
                {"type": "peer-dependency", **graph_kwargs},
                {"type": "peer-dependency", **graph_kwargs},
                repo,
            )
        )
        nodes = (
            [repo_node]
            + dependencies_nodes
            + dev_dependencies_nodes
            + peer_dependencies_nodes
        )
        links = dependencies_links + dev_dependencies_links + peer_dependencies_links
    else:
        print(f"No package.json found for {repo.get('name')}")

    return (nodes, links)
