interface OutdatedDependency {
  name: string;
  current: string;
  wanted: string;
  latest: string;
}

export interface PackageData {
  name: string;
  url: string;
  language: string;
  build_name: string;
  outdated_dependencies: OutdatedDependency[];
  error: null | string;
}

export type OutdatedDependenciesData = PackageData[];
