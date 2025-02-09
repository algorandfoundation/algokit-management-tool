import csv
import json
import os
from io import StringIO
from pathlib import Path
from typing import Dict, List

import requests


class Node:
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.children: List[Node] = []

def parse_id(id_str: str) -> List[int]:
    return [int(x) for x in id_str.split('.')]

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
                if child.name == csv_data[get_row_index(csv_data, id_parts[:i+1])][2]:
                    current = child
                    break
        
        current.children.append(node)
    
    return convert_to_dict(root)

def get_row_index(csv_data: List[List[str]], id_parts: List[int]) -> int:
    id_str = '.'.join(str(x) for x in id_parts)
    for i, row in enumerate(csv_data):
        if row[0] == id_str:
            return i
    return -1

def convert_to_dict(node: Node) -> Dict:
    result = {
        "name": node.name,
        "description": node.description
    }
    if node.children:
        result["children"] = [convert_to_dict(child) for child in node.children]
    return result

def read_csv_data(file_path: str) -> List[List[str]]:
    with open(file_path, 'r') as f:
        reader = csv.reader(f, delimiter='|')
        return list(reader)

def read_google_sheets(sheet_url: str) -> List[List[str]]:
    """
    Reads data from multiple tabs in a Google Sheet and combines them into a single dataset.
    
    Args:
        sheet_url: URL of the published Google Sheet
        tab_names: List of tab names to read from
        
    Returns:
        Combined list of rows from all specified tabs
    """
    # Extract the sheet ID from the URL
    sheet_id = sheet_url.split('/')[5]
    
    tab_names = ["SmartContract", "Typed Client Generation", "Typed Client Generation", "Templates", "Wallet Management", "Transaction Management", "Account Management", "Fund Account", "Ledger Observability", "Environment Management"]
    all_rows = []
    header = None
    
    for i,tab_name in enumerate(tab_names):
        # Construct the CSV export URL for each tab
        csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={tab_name}"
        
        try:
            # Read CSV data from the URL with Google authorization
            headers = {
                'Authorization': f'Bearer {os.environ.get("GOOGLE_API_TOKEN")}',
                'Accept': 'text/csv'
            }
            response = requests.get(csv_url, headers=headers)
            response.raise_for_status()
            
            # Parse CSV content
            csv_content = StringIO(response.text)
            reader = csv.reader(csv_content)
            rows = list(reader)
            
            # Store header from first tab
            if header is None:
                header = rows[0]
                all_rows.append(header)
            
            # Add all non-header rows with modified first character
            all_rows.extend([([str(i+1) + row[0][1:] if row and len(row[0]) > 0 else row[0]] + row[1:]) for row in rows[1:]])
            
        except requests.RequestException as e:
            print(f"Error reading tab {tab_name}: {str(e)}")
            continue
            
    return all_rows

def validate_csv_data(csv_data: List[List[str]]) -> None:
    """
    Validates CSV data according to required rules and prints warnings for any issues.
    
    Args:
        csv_data: List of rows from CSV, where each row is a list of strings
    """
    has_warnings = False
    # Skip header row
    for i, row in enumerate(csv_data[1:], start=2):
        if not row or not row[0]:
            print(f"WARNING: Empty first element found in row {i}: {row}")
            has_warnings = True
            
        if row[0].endswith('.'):
            print(f"WARNING: First element ends with period in row {i}: {row}")
            has_warnings = True
            
    if has_warnings:
        print("\nPlease review the warnings above and fix any issues in the source data.")
    return has_warnings



# Example usage
if __name__ == "__main__":
    # Replace with your CSV file path
    # path = Path(__file__).parent / "spec_data.csv"
    # csv_data = read_csv_data(str(path))
    csv_data = read_google_sheets("https://docs.google.com/spreadsheets/d/1wCD10BlHGjqAAGfKwp1Mpd7K0OfEeeKwB4yzRRM2DmM/edit?gid=0#gid=0")
    has_warnings = validate_csv_data(csv_data)
    if has_warnings:
        exit(1)

    tree = build_tree(csv_data)
    
    # Write the result to a JSON file
    output_path = Path(__file__).parent / "tree_data.json"
    with open(output_path, 'w') as f:
        json.dump(tree, f, indent=2)