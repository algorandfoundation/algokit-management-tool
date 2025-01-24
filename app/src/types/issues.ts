export interface IssuesApiResponse {
  results: IssueOrPullRequest[];
  metadata: Metadata;
}

interface Metadata {
  created_at: string;
  version: string;
  repository_count: number;
  source: string;
}

interface BaseIssueOrPullRequest {
  repository: string;
  title: string;
  number: number;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  labels: string[];
  assignees: string[];
  commentsCount: number;
  body: string | null;
  author: string;
  closedAt: string | null;
}

interface Issue extends BaseIssueOrPullRequest {
  isPullRequest: false;
  pullRequest: null;
}

interface PullRequest extends BaseIssueOrPullRequest {
  isPullRequest: true;
  pullRequest: PullRequestDetails;
}

export type IssueOrPullRequest = Issue | PullRequest;

interface PullRequestDetails {
  url: string | null;
  comments: number | null;
  reviewComments: number | null;
}
