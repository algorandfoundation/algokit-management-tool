import csv
from io import StringIO
from typing import Dict, List

import requests

from app.core.config import settings
from app.core.logging import LoggerFactory
from app.utils.github import get_github_token

logger = LoggerFactory.get_logger(__name__)


class Node:
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.children: List[Node] = []


def parse_id(id_str: str) -> List[int]:
    return [int(x) for x in id_str.split(".")]


def get_row_index(csv_data: List[List[str]], id_parts: List[int]) -> int:
    id_str = ".".join(str(x) for x in id_parts)
    for i, row in enumerate(csv_data):
        if row[0] == id_str:
            return i
    return -1


def convert_to_dict(node: Node) -> Dict:
    result = {"name": node.name, "description": node.description}
    if node.children:
        result["children"] = [convert_to_dict(child) for child in node.children]
    return result


def build_tree(csv_data: List[List[str]]) -> Dict:
    root = Node("Functional Specifications")

    # Skip header row
    for row in csv_data[1:]:
        id_str, level, spec_name, description = row[0:4]

        # Create node with description
        node = Node(spec_name, description)

        # Find parent
        current = root
        id_parts = parse_id(id_str)

        # Navigate to the correct parent
        for i in range(len(id_parts) - 1):
            for child in current.children:
                if (
                    child.name
                    == csv_data[get_row_index(csv_data, id_parts[: i + 1])][2]
                ):
                    current = child
                    break

        current.children.append(node)

    return convert_to_dict(root)


def read_google_sheets(sheet_url: str) -> List[List[str]]:
    """
    Reads data from multiple tabs in a Google Sheet and combines them into a single dataset.
    """
    sheet_id = sheet_url.split("/")[5]

    tab_names = [
        "1-Smart-Contract",
        "2-Templates",
        "3-Account-Management",
        "4-Transaction-Management",
        "5-Ledger-Observability",
        "6-Environment-Management",
    ]
    all_rows = []
    header = None

    for i, tab_name in enumerate(tab_names):
        csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={tab_name}"

        try:
            headers = {
                "Authorization": f"Bearer {get_github_token()}",
                "Accept": "text/csv",
            }
            response = requests.get(csv_url, headers=headers)
            response.raise_for_status()

            csv_content = StringIO(response.text)
            reader = csv.reader(csv_content)
            rows = list(reader)

            if header is None:
                header = rows[0]
                all_rows.append(header)

            all_rows.extend(
                [
                    (
                        [str(i + 1) + row[0][1:] if row and len(row[0]) > 0 else row[0]]
                        + row[1:]
                    )
                    for row in rows[1:]
                ]
            )

        except requests.RequestException as e:
            logger.error(f"Error reading tab {tab_name}: {str(e)}")
            continue

    return all_rows


def validate_csv_data(csv_data: List[List[str]]) -> bool:
    """
    Validates CSV data according to required rules and prints warnings for any issues.
    """
    has_warnings = False
    for i, row in enumerate(csv_data[1:], start=2):
        if not row or not row[0]:
            logger.warning(f"Empty first element found in row {i}: {row}")
            has_warnings = True

        if row[0].endswith("."):
            logger.warning(f"First element ends with period in row {i}: {row}")
            has_warnings = True

    return has_warnings


def get_functional_specs() -> Dict:
    """
    Main function to fetch and process functional specifications.
    """
    try:
        csv_data = read_google_sheets(settings.FUNCTIONAL_SPECS_SHEET_URL)
        if validate_csv_data(csv_data):
            logger.error("Validation warnings found in specifications data")
            raise ValueError("Validation warnings found in specifications data")

        return build_tree(csv_data)
    except Exception as e:
        logger.error(f"Error processing functional specifications: {str(e)}")
        raise
