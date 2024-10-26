import requests
from typing import Dict, List, Any, Tuple
import re
import json
import tomllib

from validate import validate

# Configuration
organization = "algorand_foundation"

repos = [
    {
        "name": "puya",
        "owner": organization,
        "build_name": "algorand-python",
        "language": "python",
    },
    # {
    #     "name": "algorand-python-testing",
    #     "owner": organization,
    #     "build_name": "algorand-python-testing",
    #     "language": "python",
    # },
     {
        "name": "algokit-cli",
        "owner": organization,
        "build_name": "algokit",
        "language": "python",
    },
    {
        "name": "algokit-utils-py",
        "owner": organization,
        "build_name": "algokit-utils",
        "language": "python",
    },
    {
        "name": "algokit-client-generator-py",
        "owner": organization,
        "build_name": "algokit-client-generator",
        "language": "python",
    },
    {
        "name": "algokit-subscriber-py",
        "owner": organization,
        "build_name": "algokit-subscriber",
        "language": "python",
    },
    {
        "name": "algokit-lora",
        "owner": organization,
        "build_name": None,
        "language": "javascript",
    },
    # Explore is a private repo
    # {"name": "algokit-explore", "build_name": None},
    # puya ts not ready yet
    # {
    #     "name": "puya-ts",
    #     "owner": organization,
    #     "build_name": "@algorandfoundation/algorand-typescript",
    #     "language": "javascript",
    # },
    {
        "name": "algokit-utils-ts",
        "owner": organization,
        "build_name": "@algorandfoundation/algokit-utils",
        "language": "javascript",
    },
    {
        "name": "algokit-subscriber-ts",
        "owner": organization,
        "build_name": "@algorandfoundation/algokit-subscriber",
        "language": "javascript",
    },
    {
        "name": "algokit-client-generator-ts",
        "owner": organization,
        "build_name": "@algorandfoundation/algokit-client-generator",
        "language": "javascript",
    },
    # Not sure this gets published
    # {
    #     "name": "algokit-dispenser-api",
    #     "owner": organization,
    #     "build_name": "algokit-testnet-dispenser",
    #     "language": "javascript",
    # },
    {
        "name": "algokit-avm-vscode-debugger",
        "owner": organization,
        "build_name": "algokit-avm-vscode-debugger",
        "language": "javascript",
    },
     {
        "name": "algokit-utils-ts-debug",
        "owner": organization,
        "build_name": "@algorandfoundation/algokit-utils-debug",
        "language": "javascript",
    },
]
algo_fnd_repo_regex = "|".join(
    [r.get("build_name") for r in repos if r.get("build_name") is not None]
)
makerx_repo_regex = "@makerx"
algorand_tech_regex = "py-algorand-sdk"


def get_node_name(repo: Dict) -> str:
    build_name = repo.get("build_name")
    if build_name is not None:
        return build_name

    return repo.get("name")


def get_package_owner(package_name: str) -> str:
    owner = "other"
    if re.search(algo_fnd_repo_regex, package_name) is not None:
        owner = "algorand_foundation"
    elif re.search(makerx_repo_regex, package_name) is not None:
        owner = "makerx"
    elif re.search(algorand_tech_regex, package_name) is not None:
        owner = "algorand_technologies"

    return owner


def get_node_links_from_js_deps(
    input_dict: Dict[str, str], node_data: Dict, link_data: Dict, repo: Dict
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    if input_dict is None or len(input_dict) == 0:
        return ([], [])
    repo_node_name = get_node_name(repo)

    nodes = [
        {
            "id": f"{repo_node_name}-{name}",
            "name": name,
            "version": [version],
            "owner": get_package_owner(name),
            **node_data,
        }
        for name, version in input_dict.items()
    ]
    links = [
        {"source": f"{name}", "target": repo_node_name, **link_data}
        for name, _ in input_dict.items()
    ]

    return (nodes, links)


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
            print(f"Invalid version for name: {name} version {version} in {repo_node_name}")
        nodes.append(
            {
                "id": f"{repo_node_name}-{name}",
                "name": name,
                "version": [version],
                "owner": get_package_owner(name),
                **node_data,
            }
        )
    
    links = [
        {"source": f"{name}", "target": repo_node_name, **link_data}
        for name, _ in input_dict.items()
    ]

    return (nodes, links)

def get_version_from_pyproject_toml(pyproject_toml_data: Dict[str, Any]) -> str:
    if pyproject_toml_data.get("tool").get("poetry") is not None:
        return pyproject_toml_data.get("tool").get("poetry").get("version")
    if pyproject_toml_data.get("tool").get("hatch") is not None: 
        return pyproject_toml_data.get("project").get("version")
    raise ValueError("No version found in pyproject.toml")

def get_dep_data_from_repo(repo: Dict[str, Any]) -> Dict[str, Any]:
    language = repo.get("language")
    organization = re.sub("_",'',repo.get("owner"))
    repo_name = repo.get("name")

    url = f"https://api.github.com/repos/{organization}/{repo_name}/contents"
    repo_contents_response = requests.get(url)
    repo_contents = repo_contents_response.json()

    repo_node = {
        "id": get_node_name(repo),
        "name": get_node_name(repo),
        "owner": repo.get("owner"),
        "language": repo.get("language"),
        "type": "dependency",
    }

    nodes = None
    links = None
    if language == "python":
        graph_kwargs = {"language": "python"}
        pyproject_toml = [
            item for item in repo_contents if item["name"] == "pyproject.toml"
        ]
        if len(pyproject_toml) > 0:
            pyproject_toml_url = pyproject_toml[0].get("download_url")
            pyproject_toml_response = requests.get(pyproject_toml_url)
            pyproject_toml_data = tomllib.loads(pyproject_toml_response.text)
            repo_node["version"] = [
                get_version_from_pyproject_toml( pyproject_toml_data)
            ]

            (dependencies_nodes, dependencies_links) = get_node_links_from_py_deps(
                pyproject_toml_data.get("tool").get("poetry").get("dependencies"),
                {"type": "dependency", **graph_kwargs},
                {"type": "dependency", **graph_kwargs},
                repo,
            )
            (dev_dependencies_nodes, dev_dependencies_links) = (
                get_node_links_from_py_deps(
                    pyproject_toml_data.get("tool")
                    .get("poetry")
                    .get("group")
                    .get("dev")
                    .get("dependencies"),
                    {"type": "dev-dependency", **graph_kwargs},
                    {"type": "dev-dependency", **graph_kwargs},
                    repo,
                )
            )
            # (testing_dependencies_nodes, testing_dependencies_links) = (
            #     get_node_links_from_py_deps(
            #         pyproject_toml_data.get("tool")
            #         .get("poetry")
            #         .get("group")
            #         .get("testing")
            #         .get("dependencies"),
            #         {"type": "testing-dependency", **graph_kwargs},
            #         {"type": "testing-dependency", **graph_kwargs},
            #         repo,
            #     )
            # )
            nodes = [repo_node] + dependencies_nodes + dev_dependencies_nodes
            links = dependencies_links + dev_dependencies_links 
    elif language == "javascript":
        graph_kwargs = {"language": "javascript"}
        package_json = [
            item for item in repo_contents if item["name"] == "package.json"
        ]
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
            (dev_dependencies_nodes, dev_dependencies_links) = (
                get_node_links_from_js_deps(
                    package_json_data.get("devDependencies"),
                    {"type": "dev-dependency", **graph_kwargs},
                    {"type": "dev-dependency", **graph_kwargs},
                    repo,
                )
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
            links = (
                dependencies_links + dev_dependencies_links + peer_dependencies_links
            )

        else:
            print(f"No package.json found for {repo_name}")

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

    nodes, links = validate({"nodes": nodes, "links": links})
    repo_deps = {"nodes": nodes, "links": links}

    with open("dependencies.json", "w") as f:
        json.dump(repo_deps, f, indent=4)


if __name__ == "__main__":
    main()
