from typing import Dict
import re
from config import repos

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
