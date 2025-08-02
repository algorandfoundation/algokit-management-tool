import { Dependency, RepositoryInfo } from "../../types/dependencies";

export const flattenDependencies = (data: RepositoryInfo[]): Dependency[] => {
  return data.flatMap((repo) =>
    (repo.outdated_dependencies ?? []).map((dependency) => ({
      repoName: repo.name,
      repoUrl: repo.url,
      repoLanguage: repo.language,
      repoBuildName: repo.build_name,
      repoError: repo.error,
      packageName: dependency.name,
      packageCurrent: dependency.current,
      packageWanted: dependency.wanted,
      packageLatest: dependency.latest,
    }))
  );
};
