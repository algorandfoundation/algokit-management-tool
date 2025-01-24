import { GroupTooltip } from "@/components/group-tooltip";
import StackedBarGraph from "../../components/stacked-bar-graph";
import { Dependency } from "../../types/dependencies";
export interface OutdatedDependenciesGraphProps {
  data: Dependency[];
}

const compareVersions = (
  current: string,
  target: string
): "major" | "minor" | "small" | "none" => {
  const [currentMajor, currentMinor] = current.split(".").map(Number);
  const [targetMajor, targetMinor] = target.split(".").map(Number);

  if (targetMajor > currentMajor) return "major";
  if (targetMajor === currentMajor && targetMinor - currentMinor > 2)
    return "minor";
  if (targetMajor === currentMajor && targetMinor > currentMinor)
    return "small";
  return "none";
};

export default function OutdatedDependenciesGraph({
  data,
}: OutdatedDependenciesGraphProps) {
  const config = {
    groupByKey: (pkg: Dependency) => pkg.repoName,
    categories: ["major", "minor", "small", "patch"],
    categoryMatchers: {
      major: (pkg: Dependency) =>
        compareVersions(pkg.packageCurrent, pkg.packageLatest) === "major",
      minor: (pkg: Dependency) =>
        compareVersions(pkg.packageCurrent, pkg.packageLatest) === "minor",
      small: (pkg: Dependency) =>
        compareVersions(pkg.packageCurrent, pkg.packageLatest) === "small",
      patch: (pkg: Dependency) =>
        compareVersions(pkg.packageCurrent, pkg.packageLatest) === "none",
    },
    colors: {
      major: "rgba(239, 68, 68, 0.7)",
      minor: "rgba(249, 115, 22, 0.7)",
      small: "rgba(234, 179, 8, 0.7)",
      patch: "rgba(34, 197, 94, 0.7)",
    },
    yAxisLabel: "Outdated Dependencies Count",
  };

  return (
    <StackedBarGraph<Dependency>
      data={data}
      config={config}
      TooltipComponent={GroupTooltip}
    />
  );
}
