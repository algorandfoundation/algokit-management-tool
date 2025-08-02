export interface PullRequest {
  repository: string;
  title: string;
  number: number;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  htmlUrl: string;
  labels: string[];
  assignees: string[];
  reviewers: string[];
  commentsCount: number;
  author: string;
  branch: string;
  mergeable: boolean | null;
  draft: boolean;
  merged: boolean;
  mergedAt: string | null;
  mergedBy: string | null;
  isDependabot: boolean;
}

export interface RepositoryMetrics {
  closed: number;
  merged: number;
  dependabot: number;
}

export interface PeriodMetrics {
  total_closed: number;
  total_merged: number;
  dependabot_closed: number;
  dependabot_merged: number;
  human_closed: number;
  human_merged: number;
  by_repository: Record<string, RepositoryMetrics>;
}

export interface PullRequestMetrics {
  "24_hours": PeriodMetrics;
  "7_days": PeriodMetrics;
}

export interface PullRequestApiResponse {
  results: PullRequest[];
  metrics: PullRequestMetrics;
  metadata: {
    created_at: string;
    version: string;
    repository_count: number;
    source: string;
    pr_count: number;
  };
}