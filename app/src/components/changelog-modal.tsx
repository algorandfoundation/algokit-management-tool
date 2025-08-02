import { useState, useEffect } from 'react';
import { MarkdownRenderer } from './markdown-renderer';

interface ChangelogData {
  results: Array<{
    repository_name: string;
    version: string | null;
    release_notes: string;
    changes: Array<{
      category: string;
      description: string;
      files_affected: string[];
      impact: string;
    }>;
    breaking_changes: boolean;
    days_back: number;
    commit_count: number;
  }>;
  markdown: string;
  failed_repositories?: Array<{
    repository: string;
    error: string;
  }>;
  metadata: {
    created_at: string;
    version: string;
    days_back: number;
    repository_count: number;
    repositories_processed: number;
    source: string;
    total_commits: number;
    total_changes: number;
  };
}

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const [changelogData, setChangelogData] = useState<ChangelogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !changelogData) {
      fetchChangelog();
    }
  }, [isOpen, changelogData]);

  const fetchChangelog = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://storage.googleapis.com/algokit-management-tool/site/changelog/latest.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch changelog: ${response.status}`);
      }
      
      const data: ChangelogData = await response.json();
      setChangelogData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch changelog');
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl max-h-[90vh] flex flex-col p-0">
        {/* Fixed Header */}
        <div className="px-6 pt-6 pb-4 border-b border-base-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl">Changelog (Last 7 Days)</h3>
            <button className="btn btn-ghost text-lg" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <span>Error: {error}</span>
            </div>
          )}

          {changelogData && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                <div className="stat">
                  <div className="stat-title text-base font-semibold">Repositories</div>
                  <div className="stat-value text-2xl font-bold">
                    {changelogData.metadata.repositories_processed}/{changelogData.metadata.repository_count}
                  </div>
                  <div className="stat-desc text-sm">Successfully processed</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-base font-semibold">Total Commits</div>
                  <div className="stat-value text-2xl font-bold">{changelogData.metadata.total_commits}</div>
                  <div className="stat-desc text-sm">Last 7 days</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-base font-semibold">Total Changes</div>
                  <div className="stat-value text-2xl font-bold">{changelogData.metadata.total_changes}</div>
                  <div className="stat-desc text-sm">Categorized</div>
                </div>
              </div>

              {/* Failed Repositories Alert */}
              {changelogData.failed_repositories && changelogData.failed_repositories.length > 0 && (
                <div className="alert alert-warning">
                  <div>
                    <h4 className="font-semibold text-base">Failed Repositories:</h4>
                    <ul className="list-disc list-inside mt-2">
                      {changelogData.failed_repositories.map((failed, index) => (
                        <li key={index} className="text-sm">
                          <strong>{failed.repository}:</strong> {failed.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Markdown Content */}
              <MarkdownRenderer content={changelogData.markdown} />
            </div>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
} 