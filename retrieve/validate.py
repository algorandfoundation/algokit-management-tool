def validate_unique_nodes(nodes):
    unique_nodes = {}
    for node in nodes:
        node_id = node.get("id")
        node_version = node.get("version")
        if node_id in unique_nodes:
            print(f"Duplicate node found: {node_id}")
            current_versions = unique_nodes[node_id]["version"]
            unique_nodes[node_id]["version"] = list(
                set(current_versions + node_version)
            )

        else:
            unique_nodes[node_id] = node

    return list(unique_nodes.values())


def validate_links_contain_nodes(nodes, links):
    node_names = list(set([node.get("id") for node in nodes]))
    for link in links:
        source = link.get("source")
        target = link.get("target")
        if source not in node_names:
            print(f"WARN: Link source not found in nodes: {source}")
        if target not in node_names:
            print(f"WARN: Link target not found in nodes: {target}")


def validate(data):
    nodes = data.get("nodes", [])
    links = data.get("links", [])
    nodes = validate_unique_nodes(nodes)
    validate_links_contain_nodes(nodes, links)

    return nodes, links


if __name__ == "__main__":
    validate()  # This will raise an error because no argument is passed
