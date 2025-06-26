export interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
  author: string;
}

export interface RepositoryReleases {
  id: string; // Required for DataTable component
  repository: string;
  latest_main_release: Release | null;
  latest_beta_release: Release | null;
}

export interface ReleasesApiResponse {
  results: RepositoryReleases[];
  metadata: {
    created_at: string;
    version: string;
    repository_count: number;
    source: string;
  };
}
