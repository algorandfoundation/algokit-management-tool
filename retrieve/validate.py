

def validate_unique_nodes(nodes):
    unique_nodes = {}
    for node in nodes:
        node_id = node.get("name")
        node_version = node.get("version")
        if node_id in unique_nodes:
            print(f"Duplicate node found: {node_id}")
            current_versions = unique_nodes[node_id]["version"]
            unique_nodes[node_id]["version"] = list(set(current_versions + node_version))
                
        else:
            unique_nodes[node_id] = node

    return list(unique_nodes.values())
    

def validate(data):
    nodes = data.get("nodes", [])
    links = data.get("links", [])
    nodes = validate_unique_nodes(nodes)

    return nodes, links

if __name__ == "__main__":
    validate()  # This will raise an error because no argument is passed