import { useSuspenseQuery } from "@tanstack/react-query";
import type { PullRequestApiResponse } from "@/types/pull-requests";

const PR_METRICS_URL =
  "https://storage.googleapis.com/algokit-management-tool/site/metrics/pull_request/latest.json";

export const fetchPRMetrics = async (): Promise<PullRequestApiResponse> => {
  const response = await fetch(PR_METRICS_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch PR metrics: ${response.statusText}`);
  }

  const data: PullRequestApiResponse = await response.json();
  return data;
};

export const usePRMetrics = () => {
  return useSuspenseQuery({
    queryKey: ["pr-metrics"],
    queryFn: fetchPRMetrics,
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
};
