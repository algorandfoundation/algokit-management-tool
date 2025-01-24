interface DependencyVersion {
  name: string;
  current: string;
  wanted: string;
  latest: string;
}

export interface RepositoryInfo {
  name: string;
  url: string;
  language: string;
  build_name: string | null;
  outdated_dependencies: DependencyVersion[];
  error: string | null;
}

interface Metadata {
  created_at: string;
  version: string;
  repository_count: number;
  source: string;
}

export interface OutdatedDependenciesResponse {
  results: RepositoryInfo[];
  metadata: Metadata;
}

export interface Dependency {
  // Repository properties
  repoName: string;
  repoUrl: string;
  repoLanguage: string;
  repoBuildName: string | null;
  repoError: string | null;
  // Package properties
  packageName: string;
  packageCurrent: string;
  packageWanted: string;
  packageLatest: string;
}
