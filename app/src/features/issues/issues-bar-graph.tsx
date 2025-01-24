import { GroupTooltip } from "@/components/group-tooltip";
import StackedBarGraph from "../../components/stacked-bar-graph";
import type { IssueOrPullRequest } from "../../types/issues";

interface IssuesBarGraphProps {
  data: IssueOrPullRequest[];
}

export default function IssuesBarGraph({ data }: IssuesBarGraphProps) {
  const config = {
    groupByKey: "repository" as keyof IssueOrPullRequest,
    categories: ["bug", "feature", "enhancement", "other"],
    categoryMatchers: {
      bug: (issue: IssueOrPullRequest) =>
        !issue.isPullRequest && issue.labels.includes("bug"),
      feature: (issue: IssueOrPullRequest) =>
        !issue.isPullRequest && issue.labels.includes("feature"),
      enhancement: (issue: IssueOrPullRequest) =>
        !issue.isPullRequest && issue.labels.includes("enhancement"),
      other: (issue: IssueOrPullRequest) =>
        !issue.isPullRequest &&
        !issue.labels.some((label) =>
          ["bug", "feature", "enhancement"].includes(label)
        ),
    },
    colors: {
      bug: "rgba(239, 68, 68, 0.7)",
      feature: "rgba(249, 115, 22, 0.7)",
      enhancement: "rgba(234, 179, 8, 0.7)",
      other: "rgba(34, 197, 94, 0.7)",
    },
    yAxisLabel: "Issue Count",
  };

  return (
    <StackedBarGraph
      data={data}
      config={config}
      TooltipComponent={GroupTooltip}
    />
  );
}
