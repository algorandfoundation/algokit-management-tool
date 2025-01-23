import re
from typing import Any, Dict, List, Tuple

import requests
import tomllib

from .utils import get_node_name, get_package_owner


def get_version_from_pyproject_toml(pyproject_toml_data: Dict[str, Any]) -> str:
    if pyproject_toml_data.get("tool").get("poetry") is not None:
        return pyproject_toml_data.get("tool").get("poetry").get("version")
    if pyproject_toml_data.get("tool").get("hatch") is not None:
        return pyproject_toml_data.get("project").get("version")
    raise ValueError("No version found in pyproject.toml")


def get_node_links_from_py_deps(
    input_dict: Dict[str, str], node_data: Dict, link_data: Dict, repo: Dict
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    if input_dict is None or len(input_dict) == 0:
        return ([], [])
    repo_node_name = get_node_name(repo)
    nodes = []
    for name, version in input_dict.items():
        if not isinstance(version, str):
            version = "No Valid Version"
            print(
                f"Invalid version for name: {name} version {version} in {repo_node_name}"
            )
        nodes.append(
            {
                "id": f"{name}-{repo.get('language')}",
                "name": name,
                "version": [{"repo_name": repo_node_name, "version": version}],
                "owner": get_package_owner(name),
                **node_data,
            }
        )

    links = [
        {
            "source": f"{name}-{repo.get('language')}",
            "target": repo_node_name,
            **link_data,
        }
        for name, _ in input_dict.items()
    ]

    return (nodes, links)


def get_deps_from_poetry_pyproject_toml(
    pyproject_toml_data: Dict[str, Any], repo: Dict, repo_node: Dict, graph_kwargs: Dict
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    (dependencies_nodes, dependencies_links) = get_node_links_from_py_deps(
        pyproject_toml_data.get("tool").get("poetry").get("dependencies"),
        {"type": "dependency", **graph_kwargs},
        {"type": "dependency", **graph_kwargs},
        repo,
    )
    (dev_dependencies_nodes, dev_dependencies_links) = get_node_links_from_py_deps(
        pyproject_toml_data.get("tool")
        .get("poetry")
        .get("group")
        .get("dev")
        .get("dependencies"),
        {"type": "dev-dependency", **graph_kwargs},
        {"type": "dev-dependency", **graph_kwargs},
        repo,
    )
    nodes = [repo_node] + dependencies_nodes + dev_dependencies_nodes
    links = dependencies_links + dev_dependencies_links
    return (nodes, links)


def get_deps_from_hatch_pyproject_toml(
    pyproject_toml_data: Dict[str, Any], repo: Dict, repo_node: Dict, graph_kwargs: Dict
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Extract all dependencies from a hatch-style pyproject.toml file."""
    dependencies = {}

    # Get main project dependencies
    nodes = [repo_node]
    links = []
    project_deps = pyproject_toml_data.get("project", {}).get("dependencies", [])
    for dep in project_deps:
        parts = re.split(r"(>=|<=|==|!=|~=|<|>)", dep)
        package = parts[0].strip()
        version = "".join(parts[1:]).strip() if len(parts) > 1 else ""
        dependencies[package] = version if version else "No Valid Version"
    (dep_nodes, dep_links) = get_node_links_from_py_deps(
        dependencies,
        {"type": "dependency", **graph_kwargs},
        {"type": "dependency", **graph_kwargs},
        repo,
    )
    nodes += dep_nodes
    links += dep_links

    # Get dependencies from all hatch environments
    hatch_envs = pyproject_toml_data.get("tool", {}).get("hatch", {}).get("envs", {})
    for env_name, env_config in hatch_envs.items():
        env_deps = env_config.get("dependencies", [])
        dependencies = {}
        for dep in env_deps:
            parts = re.split(r"(>=|<=|==|!=|~=|<|>)", dep)
            package = parts[0].strip()
            version = "".join(parts[1:]).strip() if len(parts) > 1 else ""
            dependencies[package] = version if version else "No Valid Version"
        (dep_nodes, dep_links) = get_node_links_from_py_deps(
            dependencies,
            {"type": f"{env_name}_dependency", **graph_kwargs},
            {"type": f"{env_name}_dependency", **graph_kwargs},
            repo,
        )
        nodes += dep_nodes
        links += dep_links

    return (nodes, links)


def is_poetry_pyproject(pyproject_toml_data: Dict[str, Any]) -> bool:
    """Determine if pyproject.toml uses Poetry or Hatch as package manager.

    Args:
        pyproject_toml_data: Dictionary containing parsed pyproject.toml data

    Returns:
        bool: True if Poetry is used, False if Hatch is used
    """
    # Check for poetry tool section
    has_poetry = "poetry" in pyproject_toml_data.get("tool", {})

    # Check for hatch tool section
    has_hatch = "hatch" in pyproject_toml_data.get("tool", {})

    if has_poetry and has_hatch:
        # If both exist, check which one has dependencies defined
        poetry_deps = (
            pyproject_toml_data.get("tool", {}).get("poetry", {}).get("dependencies")
        )
        # hatch_deps = pyproject_toml_data.get("project", {}).get("dependencies")
        return poetry_deps is not None

    return has_poetry


def get_node_links_from_python_repo(
    repo: Dict, repo_contents: List[Dict]
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    repo_node = {
        "id": get_node_name(repo),
        "name": get_node_name(repo),
        "owner": repo.get("owner"),
        "language": repo.get("language"),
        "type": "dependency",
    }
    graph_kwargs = {"language": "python"}
    pyproject_toml = [
        item for item in repo_contents if item["name"] == "pyproject.toml"
    ]
    if len(pyproject_toml) > 0:
        pyproject_toml_url = pyproject_toml[0].get("download_url")
        pyproject_toml_response = requests.get(pyproject_toml_url)
        pyproject_toml_data = tomllib.loads(pyproject_toml_response.text)
        repo_node["version"] = [get_version_from_pyproject_toml(pyproject_toml_data)]
        if is_poetry_pyproject(pyproject_toml_data):
            (nodes, links) = get_deps_from_poetry_pyproject_toml(
                pyproject_toml_data, repo, repo_node, graph_kwargs
            )
        else:
            (nodes, links) = get_deps_from_hatch_pyproject_toml(
                pyproject_toml_data, repo, repo_node, graph_kwargs
            )

    return (nodes, links)
