import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
import json
import logging

import httpx
from pydantic_ai import Agent

from app.core.config import settings
from app.core.logging import LoggerFactory
from app.services.changelog.models import (
    ChangelogEntry, 
    RepositoryChangelog, 
    GitOperationResult,
    ChangelogMetadata
)
from app.services.changelog.git_utils import process_repository_git_data

logger = LoggerFactory.get_logger(__name__)


class ChangelogGenerator:
    """Generate changelogs from git diffs using Pydantic AI."""
    
    def __init__(self, model_name: str = "google-gla:gemini-2.0-flash-exp"):
        self.agent = Agent(
            model_name,
            output_type=RepositoryChangelog,
            system_prompt=(
                "You are a technical writer specializing in changelogs and release notes. "
                "Analyze the provided git diff and create a comprehensive changelog. "
                "Categorize changes into: Features, Bug Fixes, Breaking Changes, Documentation, "
                "Refactoring, Performance, Security, Dependencies, Chore, etc. "
                "Focus on user-facing changes and their impact. "
                "Be concise but informative. Identify breaking changes carefully. "
                "If no significant changes are found, create a minimal changelog noting maintenance updates."
            ),
            http_client=httpx.AsyncClient(timeout=httpx.Timeout(120.0))
        )
    
    async def generate_changelog(
        self, 
        git_result: GitOperationResult,
        days_back: int = 7,
        version: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate changelog from git operation result."""
        try:
            if not git_result.success:
                return {
                    "status": "error",
                    "message": git_result.error or "Git operation failed",
                    "timestamp": datetime.now().isoformat(),
                    "repository": git_result.repository_name
                }
            
            if not git_result.diff_content and not git_result.commits:
                return {
                    "status": "success",
                    "changelog": RepositoryChangelog(
                        repository_name=git_result.repository_name,
                        version=version,
                        release_notes=f"No changes found in the last {days_back} days.",
                        changes=[],
                        breaking_changes=False,
                        days_back=days_back,
                        commit_count=0
                    ).model_dump(),
                    "markdown": self._generate_no_changes_markdown(git_result.repository_name, days_back),
                    "timestamp": datetime.now().isoformat()
                }
            
            # Prepare context for AI
            context = f"Repository: {git_result.repository_name}\n"
            if version:
                context += f"Version: {version}\n"
            context += f"Days analyzed: {days_back}\n"
            context += f"Commits found: {len(git_result.commits)}\n\n"
            
            if git_result.diff_content:
                context += f"Git Diff:\n{git_result.diff_content}"
            else:
                context += "No diff content available - repository may have no changes in the specified timeframe."
            
            # Generate changelog using AI
            result = await self.agent.run(context)
            
            # Update fields that AI might not set correctly
            changelog = result.output
            changelog.days_back = days_back
            changelog.commit_count = len(git_result.commits)
            if not changelog.repository_name:
                changelog.repository_name = git_result.repository_name
            
            # Generate markdown
            markdown = self._to_markdown(changelog)
            
            return {
                "status": "success",
                "changelog": changelog.model_dump(),
                "markdown": markdown,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.exception(f"Error generating changelog for {git_result.repository_name}: {e}")
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
                "repository": git_result.repository_name
            }
    
    def _generate_no_changes_markdown(self, repo_name: str, days_back: int) -> str:
        """Generate markdown for repositories with no changes."""
        return f"# {repo_name}\n\n## Release Notes\n\nNo changes found in the last {days_back} days.\n\n"
    
    def _to_markdown(self, changelog: RepositoryChangelog) -> str:
        """Convert changelog to markdown format."""
        md = f"# {changelog.repository_name}"
        
        if changelog.version:
            md += f" v{changelog.version}"
        
        md += f"\n\n## Release Notes\n\n{changelog.release_notes}\n\n"
        
        # Add summary stats
        md += f"**Summary:** {changelog.commit_count} commits over {changelog.days_back} days\n\n"
        
        if changelog.breaking_changes:
            md += "⚠️ **This release contains breaking changes** ⚠️\n\n"
        
        if not changelog.changes:
            return md + "No categorized changes found.\n\n"
        
        # Group changes by category
        categories = {}
        for change in changelog.changes:
            if change.category not in categories:
                categories[change.category] = []
            categories[change.category].append(change)
        
        # Generate markdown for each category
        for category, changes in categories.items():
            md += f"## {category}\n\n"
            for change in changes:
                impact_emoji = {"High": "🔥", "Medium": "⚡", "Low": "✨"}.get(change.impact, "•")
                md += f"- {impact_emoji} {change.description}\n"
                if change.files_affected:
                    # Limit file list to avoid overly long entries
                    files_to_show = change.files_affected[:5]
                    files_text = "`, `".join(files_to_show)
                    if len(change.files_affected) > 5:
                        files_text += f"` and {len(change.files_affected) - 5} more"
                    md += f"  - Files: `{files_text}`\n"
            md += "\n"
        
        return md


class MultiRepoChangelogGenerator:
    """Generate changelogs for multiple repositories."""
    
    def __init__(self):
        self.generator = ChangelogGenerator()
    
    async def generate_multi_repo_changelog(
        self, 
        repositories: List[Dict[str, Any]],
        days_back: int = 7
    ) -> Dict[str, Any]:
        """
        Generate changelog for multiple repositories.
        
        Args:
            repositories: List of repository configurations from settings
            days_back: Number of days to look back for changes
        """
        try:
            changelogs = []
            markdown_sections = []
            failed_repos = []
            total_commits = 0
            total_changes = 0
            
            # Process each repository (could be done in parallel for better performance)
            git_results = []
            for repo_config in repositories:
                git_result = process_repository_git_data(repo_config, days_back)
                git_results.append(git_result)
            
            # Generate changelogs using AI
            for git_result in git_results:
                try:
                    result = await self.generator.generate_changelog(
                        git_result=git_result,
                        days_back=days_back
                    )
                    
                    if result["status"] == "success":
                        changelogs.append(result["changelog"])
                        markdown_sections.append(result["markdown"])
                        total_commits += result["changelog"].get("commit_count", 0)
                        total_changes += len(result["changelog"].get("changes", []))
                    else:
                        failed_repos.append({
                            "repository": git_result.repository_name,
                            "error": result["message"]
                        })
                        logger.error(f"Failed to generate changelog for {git_result.repository_name}: {result['message']}")
                        
                except Exception as e:
                    failed_repos.append({
                        "repository": git_result.repository_name,
                        "error": str(e)
                    })
                    logger.exception(f"Exception processing {git_result.repository_name}: {e}")
            
            # Combine all markdown sections
            if markdown_sections:
                combined_markdown = "\n\n---\n\n".join(markdown_sections)
            else:
                combined_markdown = "# Multi-Repository Changelog\n\nNo changelogs were successfully generated.\n\n"
            
            # Add summary header to combined markdown
            summary_header = f"# Multi-Repository Changelog\n\n"
            summary_header += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            summary_header += f"**Period:** Last {days_back} days\n\n"
            summary_header += f"**Repositories:** {len(changelogs)} successful, {len(failed_repos)} failed\n\n"
            summary_header += f"**Total Commits:** {total_commits}\n\n"
            summary_header += f"**Total Changes:** {total_changes}\n\n"
            
            if failed_repos:
                summary_header += "**Failed Repositories:**\n"
                for failed in failed_repos:
                    summary_header += f"- {failed['repository']}: {failed['error']}\n"
                summary_header += "\n"
            
            summary_header += "---\n\n"
            combined_markdown = summary_header + combined_markdown
            
            return {
                "status": "success",
                "changelogs": changelogs,
                "markdown": combined_markdown,
                "timestamp": datetime.now().isoformat(),
                "repositories_processed": len(changelogs),
                "failed_repositories": failed_repos,
                "metadata": ChangelogMetadata(
                    created_at=datetime.now().isoformat(),
                    version=settings.VERSION,
                    days_back=days_back,
                    repositories_processed=len(changelogs),
                    total_commits=total_commits,
                    total_changes=total_changes
                ).model_dump()
            }
            
        except Exception as e:
            logger.exception(f"Error generating multi-repo changelog: {e}")
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            } 