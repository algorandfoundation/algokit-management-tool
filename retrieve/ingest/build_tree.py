import csv
from typing import Dict, List
from pathlib import Path
import json


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

# Example usage
if __name__ == "__main__":
    # Replace with your CSV file path
    path = Path(__file__).parent / "spec_data.csv"
    csv_data = read_csv_data(str(path))
    tree = build_tree(csv_data)
    
    # Write the result to a JSON file
    output_path = Path(__file__).parent / "tree_data.json"
    with open(output_path, 'w') as f:
        json.dump(tree, f, indent=2)