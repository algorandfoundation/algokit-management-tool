from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple, Any
import requests

from app.core.config import settings


def get_previous_day_range_iso() -> Tuple[str, str]:
    """Gets the start and end ISO 8601 timestamps for the previous full calendar day in UTC."""
    start_date = datetime.now(timezone.utc).date() - timedelta(days=5)
    start_date_min = datetime.combine(
        start_date, datetime.min.time(), tzinfo=timezone.utc
    )
    yesterday = datetime.now(timezone.utc).date() - timedelta(days=1)
    end_of_yesterday = datetime.combine(
        yesterday, datetime.max.time(), tzinfo=timezone.utc
    )
    return start_date_min.isoformat(timespec="seconds").replace(
        "+00:00", "Z"
    ), end_of_yesterday.isoformat(timespec="seconds").replace("+00:00", "Z")


def _process_runs(
    runs: List[Dict[str, Any]],
    start_date_iso: str,
    end_date_iso: str,
    current_total: int,
    current_success: int,
    current_failed: int,
) -> Tuple[int, int, int]:
    """Processes a list of workflow runs, filters by date, and updates counts."""
    total = current_total
    success = current_success
    failed = current_failed

    start_dt = datetime.fromisoformat(start_date_iso.replace("Z", "+00:00"))
    end_dt = datetime.fromisoformat(end_date_iso.replace("Z", "+00:00"))

    for run in runs:
        run_created_at = datetime.fromisoformat(
            run["created_at"].replace("Z", "+00:00")
        )

        if start_dt <= run_created_at <= end_dt:
            total += 1
            if run["status"] == "completed":
                if run["conclusion"] == "success":
                    success += 1
                else:
                    failed += 1

    return total, success, failed


async def get_pipeline_status() -> Tuple[List[Dict[str, Any]], str, str]:
    """Fetches GitHub Actions runs for the specified date range across monitored repositories."""
    all_runs: List[Dict[str, Any]] = []

    start_date_iso, end_date_iso = get_previous_day_range_iso()
    date_query = f"{start_date_iso}..{end_date_iso}"

    headers = {
        "Authorization": f"token {settings.GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    for repo in settings.REPOSITORIES:
        owner, name = repo["owner"], repo["name"]
        page = 1
        per_page = 100
        while True:
            api_url = f"https://api.github.com/repos/{owner}/{name}/actions/runs"
            params = {
                "created": date_query,
                "per_page": per_page,
                "page": page,
            }

            try:
                response = requests.get(api_url, headers=headers, params=params)
                response.raise_for_status()
                runs_data = response.json()
                runs = runs_data.get("workflow_runs", [])

                if not runs:
                    break

                all_runs.extend(runs)

                link_header = response.headers.get("Link")
                if link_header and 'rel="next"' not in link_header:
                    break

                page += 1

            except requests.exceptions.RequestException as e:
                break
            except Exception as e:
                break

    return all_runs, start_date_iso, end_date_iso
