import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePRMetrics } from "@/hooks/use-pr-metrics";
import { GitPullRequest, GitMerge, Bot, Users } from "lucide-react";

export function PRMetricsCards() {
  const { data } = usePRMetrics();
  
  if (!data || !data.metrics) {
    return null;
  }

  const { metrics } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 24-hour metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            PRs Closed (24hr)
          </CardTitle>
          <GitPullRequest className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics["24_hours"].total_closed}</div>
          <p className="text-xs text-muted-foreground">
            {metrics["24_hours"].total_merged} merged, {metrics["24_hours"].total_closed - metrics["24_hours"].total_merged} closed without merge
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            PRs Merged (24hr)
          </CardTitle>
          <GitMerge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics["24_hours"].total_merged}</div>
          <p className="text-xs text-muted-foreground">
            {metrics["24_hours"].human_merged} human, {metrics["24_hours"].dependabot_merged} dependabot
          </p>
        </CardContent>
      </Card>

      {/* 7-day metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            PRs Closed (7 days)
          </CardTitle>
          <GitPullRequest className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics["7_days"].total_closed}</div>
          <p className="text-xs text-muted-foreground">
            {metrics["7_days"].total_merged} merged, {metrics["7_days"].total_closed - metrics["7_days"].total_merged} closed without merge
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Dependabot PRs (7 days)
          </CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics["7_days"].dependabot_closed}</div>
          <p className="text-xs text-muted-foreground">
            {metrics["7_days"].dependabot_merged} merged, {metrics["7_days"].dependabot_closed - metrics["7_days"].dependabot_merged} closed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}