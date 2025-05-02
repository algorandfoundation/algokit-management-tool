# backend-app/app/services/slack/integrator.py
import json
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List
import re

from google.cloud import storage

from app.core.config import settings


def strip_org_from_repo_name(repo_name: str) -> str:
    """Remove organization prefix from repository name if it matches settings.GITHUB_ORG."""
    if not repo_name:
        return repo_name
        
    # Pattern to match org/repo format where org is GITHUB_ORG
    pattern = f"^{re.escape(settings.GITHUB_ORG)}/(.+)$"
    match = re.match(pattern, repo_name)
    
    if match:
        return match.group(1)
    return repo_name


def get_data_from_storage(folder_name: str) -> Dict[str, Any]:
    """Fetch the latest data from the specified GCS folder."""
    try:
        client = storage.Client()
        bucket = client.bucket(settings.GCP_BUCKET_NAME)
        blob = bucket.blob(
            f"{settings.GCP_BUCKET_SITE_FOLDER_NAME}/{folder_name}/latest.json"
        )

        file_contents = blob.download_as_string()
        return json.loads(file_contents)
    except Exception as e:
        print(f"Error fetching data from {folder_name}: {e}")
        return {"results": [], "metadata": {}}


def process_pull_request_data(pr_data: Dict[str, Any]) -> Dict[str, Dict[str, int]]:
    """Process pull request data and return counts by repository."""
    pr_counts = {}

    for pr_item in pr_data.get("results", []):
        repo_name = pr_item.get("repository")
        if not repo_name:
            continue
            
        repo_name = strip_org_from_repo_name(repo_name)

        # Initialize repo counts if not already tracked
        if repo_name not in pr_counts:
            pr_counts[repo_name] = {"open_pr_count": 0, "dependabot_pr_count": 0}

        pr_counts[repo_name]["open_pr_count"] += 1

        # Check if PR is from dependabot
        if pr_item.get("author") == "dependabot[bot]":
            pr_counts[repo_name]["dependabot_pr_count"] += 1

    return pr_counts


def process_issues_data(issues_data: Dict[str, Any]) -> Dict[str, Dict[str, int]]:
    """Process issues data and return counts by repository, excluding PRs."""
    issues_counts = {}

    for issue_item in issues_data.get("results", []):
        # Skip if this is a pull request
        if issue_item.get("isPullRequest", False):
            continue

        repo_name = issue_item.get("repository")
        if not repo_name:
            continue
            
        repo_name = strip_org_from_repo_name(repo_name)

        # Initialize repo counts if not already tracked
        if repo_name not in issues_counts:
            issues_counts[repo_name] = {"open_issue_count": 0, "bug_issue_count": 0}

        # Count open issues
        if issue_item.get("state") == "open":
            issues_counts[repo_name]["open_issue_count"] += 1

            # Check if issue has the "bug" label
            labels = [label.lower() for label in issue_item.get("labels", [])]
            if "bug" in labels:
                issues_counts[repo_name]["bug_issue_count"] += 1

    return issues_counts


def process_pipeline_data(pipeline_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Process pipeline run data and calculate success rates by repository."""
    pipeline_stats = {}

    for run in pipeline_data.get("results", []):
        repo_name = run.get("repository", {}).get("full_name")
        if not repo_name:
            continue
            
        repo_name = strip_org_from_repo_name(repo_name)

        # Initialize repo stats if not already tracked
        if repo_name not in pipeline_stats:
            pipeline_stats[repo_name] = {
                "total_runs": 0,
                "successful_runs": 0,
                "success_rate": 0,
            }

        # Increment counters
        pipeline_stats[repo_name]["total_runs"] += 1
        if run.get("conclusion") == "success":
            pipeline_stats[repo_name]["successful_runs"] += 1

    # Calculate success rates
    for repo_stats in pipeline_stats.values():
        total = repo_stats["total_runs"]
        if total > 0:
            repo_stats["success_rate"] = (repo_stats["successful_runs"] / total) * 100

    return pipeline_stats


def compare_versions(version1: str, version2: str) -> int:
    """
    Compare two version strings.
    Returns 1 if version1 > version2, -1 if version1 < version2, 0 if equal.
    """
    try:
        # Split versions into components
        v1_parts = version1.split(".")
        v2_parts = version2.split(".")

        # Compare each part numerically
        for i in range(max(len(v1_parts), len(v2_parts))):
            # If one version has fewer parts, treat missing parts as 0
            v1_part = v1_parts[i] if i < len(v1_parts) else "0"
            v2_part = v2_parts[i] if i < len(v2_parts) else "0"

            # Extract numeric part for comparison (handle alpha/beta suffixes)
            v1_numeric = "".join(c for c in v1_part if c.isdigit())
            v2_numeric = "".join(c for c in v2_part if c.isdigit())

            # Convert to integers for comparison, default to 0 if empty
            v1_num = int(v1_numeric) if v1_numeric else 0
            v2_num = int(v2_numeric) if v2_numeric else 0

            if v1_num > v2_num:
                return 1
            elif v1_num < v2_num:
                return -1

        return 0  # Versions are equal
    except Exception:
        # Fall back to string comparison if numeric comparison fails
        return 1 if version1 > version2 else (-1 if version1 < version2 else 0)


def process_outdated_data(outdated_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Process outdated dependencies data and return counts by repository."""
    repo_outdated_deps = {}

    for repo_data in outdated_data.get("results", []):
        repo_name = repo_data.get("name")
        if not repo_name:
            continue
            
        repo_name = strip_org_from_repo_name(repo_name)

        # Initialize repo data if not already tracked
        if repo_name not in repo_outdated_deps:
            repo_outdated_deps[repo_name] = {
                "outdated_deps_count": 0,
                "outdated_deps_details": [],
            }

        # Count and collect details of outdated dependencies
        for dep in repo_data.get("outdated_dependencies", []):
            dep_name = dep.get("name")
            current_version = dep.get("current")
            latest_version = dep.get("latest")

            # Only count if latest version is greater than current version
            if current_version and latest_version:
                if compare_versions(latest_version, current_version) > 0:
                    repo_outdated_deps[repo_name]["outdated_deps_count"] += 1
                    repo_outdated_deps[repo_name]["outdated_deps_details"].append(
                        {
                            "name": dep_name,
                            "current": current_version,
                            "latest": latest_version,
                        }
                    )

    return repo_outdated_deps


def initialize_repo_summary(repo_name: str) -> Dict[str, Any]:
    """Initialize a repository summary with default values."""
    return {
        "name": repo_name,
        "outdated_deps": 0,
        "open_prs": 0,
        "dependabot_prs": 0,
        "open_issues": 0,
        "bug_issues": 0,
        "pipeline_success_rate": 0,
    }


def generate_repo_summary() -> List[Dict[str, Any]]:
    """Generate a summary of each repository from different data sources."""
    # Fetch data from different endpoints
    outdated_data = get_data_from_storage("outdated")
    pipeline_data = get_data_from_storage("pipeline-runs")
    pr_data = get_data_from_storage("pull-requests")
    issues_data = get_data_from_storage("issues")

    # Organize data by repository
    repo_summaries = {}

    # Process outdated dependencies using the dedicated function
    outdated_deps_data = process_outdated_data(outdated_data)
    
    # Update repo_summaries with outdated dependencies data
    for repo_name, data in outdated_deps_data.items():
        if repo_name not in repo_summaries:
            repo_summaries[repo_name] = initialize_repo_summary(repo_name)
            
        repo_summaries[repo_name]["outdated_deps"] = data["outdated_deps_count"]

    # Process pull requests using the dedicated function
    pr_counts = process_pull_request_data(pr_data)

    # Update repo_summaries with PR data
    for repo_name, counts in pr_counts.items():
        if repo_name not in repo_summaries:
            repo_summaries[repo_name] = initialize_repo_summary(repo_name)

        repo_summaries[repo_name]["open_prs"] = counts["open_pr_count"]
        repo_summaries[repo_name]["dependabot_prs"] = counts["dependabot_pr_count"]

    # Process issues using the dedicated function
    issues_counts = process_issues_data(issues_data)

    # Update repo_summaries with issues data
    for repo_name, counts in issues_counts.items():
        if repo_name not in repo_summaries:
            repo_summaries[repo_name] = initialize_repo_summary(repo_name)

        repo_summaries[repo_name]["open_issues"] = counts["open_issue_count"]
        repo_summaries[repo_name]["bug_issues"] = counts["bug_issue_count"]

    # Process pipeline runs using the dedicated function
    pipeline_stats = process_pipeline_data(pipeline_data)

    # Update repo_summaries with pipeline data
    for repo_name, stats in pipeline_stats.items():
        if repo_name not in repo_summaries:
            repo_summaries[repo_name] = initialize_repo_summary(repo_name)

        repo_summaries[repo_name]["pipeline_success_rate"] = stats["success_rate"]

        # Extract owner and name from full_name (format: "owner/name")
        parts = repo_name.split("/")
        if len(parts) >= 2:
            owner, name = parts[0], parts[1]
            repo_summaries[repo_name]["owner"] = owner
            repo_summaries[repo_name]["repo_name"] = name

    # Add repository links
    for repo_name, summary in repo_summaries.items():
        # Store original full name for URL generation
        original_name = repo_name
        if "/" in original_name:
            org, name = original_name.split("/", 1)
            summary["owner"] = org
            summary["repo_name"] = name
            summary["repo_url"] = f"https://github.com/{org}/{name}"
        else:
            # Use default org for repositories without org prefix
            summary["owner"] = settings.GITHUB_ORG
            summary["repo_name"] = original_name
            summary["repo_url"] = f"https://github.com/{settings.GITHUB_ORG}/{original_name}"

    return list(repo_summaries.values())


def post_to_slack() -> Dict[str, Any]:
    """Generate summary data and post it to Slack."""
    try:
        repo_summaries = generate_repo_summary()

        current_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚀 AlgoKit Repositories Status Summary - {current_date}",
                    "emoji": True,
                },
            },
            {"type": "divider"},
        ]

        if not repo_summaries:
            blocks.append(
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": "No repository data available."},
                }
            )
        else:
            # Sort repositories by name
            sorted_repos = sorted(
                repo_summaries, key=lambda x: x.get("name", "").lower()
            )
            
            # Create separate blocks for each repository instead of one large text block
            for repo in sorted_repos:
                repo_name = repo.get("name", "Unknown Repo")
                repo_url = repo.get("repo_url", "#")
                
                # Create links to issues and PRs pages
                issues_url = f"{repo_url}/issues"
                prs_url = f"{repo_url}/pulls"
                
                outdated_deps = repo.get("outdated_deps", 0)
                open_prs = repo.get("open_prs", 0)
                dependabot_prs = repo.get("dependabot_prs", 0)
                open_issues = repo.get("open_issues", 0)
                bug_issues = repo.get("bug_issues", 0)
                pipeline_success_rate = repo.get("pipeline_success_rate", 0)
                pipeline_success_rate_text = (
                    f"{pipeline_success_rate:.1f}%"
                    if pipeline_success_rate > 0
                    else "N/A"
                )

                emoji = (
                    "🟢"
                    if outdated_deps == 0 and bug_issues == 0
                    else "🟡"
                    if (outdated_deps > 0 or bug_issues > 0)
                    else "⚪️"
                )
                
                # Create link to the outdated deps data
                outdated_deps_url = f"https://storage.googleapis.com/{settings.GCP_BUCKET_NAME}/{settings.GCP_BUCKET_SITE_FOLDER_NAME}/outdated/latest.json"
                
                # Each repo gets its own block
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": (
                            f"{emoji} *<{repo_url}|{repo_name}>*\n"
                            f"<{prs_url}|PRs>: {open_prs} ({dependabot_prs} dependabot)\n"
                            f"<{issues_url}|Issues>: {open_issues} ({bug_issues} bugs)\n"
                            f"<{outdated_deps_url}|Outdated deps>: {outdated_deps}\n"
                            f"<{repo_url}/actions|Pipeline success>: {pipeline_success_rate_text}"
                        )
                    }
                })
                
                # Add a divider between repositories (except after the last one)
                if repo != sorted_repos[-1]:
                    blocks.append({"type": "divider"})

        # Post to Slack
        response = requests.post(settings.SLACK_WEBHOOK_URL, json={"blocks": blocks})
        response.raise_for_status()

        result = {
            "success": True,
            "message": "Successfully posted repository summary to Slack",
            "status_code": response.status_code,
            "repo_count": len(repo_summaries),
        }

        return result
    except Exception as e:
        error_message = str(e)
        print(f"Error posting to Slack: {error_message}")
        return {
            "success": False,
            "message": f"Error posting to Slack: {error_message}",
            "repo_count": 0,
        }
