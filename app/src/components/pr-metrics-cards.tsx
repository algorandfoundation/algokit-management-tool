import { useState } from "react";
import { usePRMetrics } from "@/hooks/use-pr-metrics";
import { GoGitPullRequest } from "react-icons/go";
import { RiRobotLine } from "react-icons/ri";
import { ChangelogModal } from "./changelog-modal";

export function PRMetricsCards() {
  const { data } = usePRMetrics();
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  
  if (!data || !data.metrics) {
    return null;
  }

  const { metrics } = data;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 24-hour metrics */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="card-title text-sm font-medium">
              PRs (24hr)
            </h2>
            <GoGitPullRequest className="h-4 w-4 text-base-content/70" />
          </div>
          <div className="text-2xl font-bold">{metrics["24_hours"].total_closed}</div>
          <p className="text-xs text-base-content/70">
            {metrics["24_hours"].total_merged} merged, {metrics["24_hours"].total_closed - metrics["24_hours"].total_merged} closed w/o merge
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="card-title text-sm font-medium">
              Dependabot PRs (24hr)
            </h2>
            <RiRobotLine className="h-4 w-4 text-base-content/70" />
          </div>
          <div className="text-2xl font-bold">{metrics["24_hours"].dependabot_closed}</div>
          <p className="text-xs text-base-content/70">
            {metrics["24_hours"].dependabot_merged} merged, {metrics["24_hours"].dependabot_closed - metrics["24_hours"].dependabot_merged} closed w/o merge
          </p>
        </div>
      </div>

      {/* 7-day metrics */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="card-title text-sm font-medium">
              PRs Closed (7 days)
            </h2>
            <GoGitPullRequest className="h-4 w-4 text-base-content/70" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{metrics["7_days"].total_closed}</div>
            <button
              className="btn btn-ghost p-0 min-h-0 hover:bg-primary/10 text-xl"
              onClick={() => setShowChangelogModal(true)}
              title="7 day CHANGELOG"
            >
              📄
            </button>
          </div>
          <p className="text-xs text-base-content/70">
            {metrics["7_days"].total_merged} merged, {metrics["7_days"].total_closed - metrics["7_days"].total_merged} closed w/o merge
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="card-title text-sm font-medium">
              Dependabot PRs (7 days)
            </h2>
            <RiRobotLine className="h-4 w-4 text-base-content/70" />
          </div>
          <div className="text-2xl font-bold">{metrics["7_days"].dependabot_closed}</div>
          <p className="text-xs text-base-content/70">
            {metrics["7_days"].dependabot_merged} merged, {metrics["7_days"].dependabot_closed - metrics["7_days"].dependabot_merged} closed w/o merge
          </p>
        </div>
      </div>
      </div>
      
      <ChangelogModal 
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
      />
    </>
  );
}