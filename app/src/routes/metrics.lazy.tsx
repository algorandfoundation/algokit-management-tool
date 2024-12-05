import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/metrics")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-dvh px-12">
      <h1 className="text-2xl font-bold ">Metrics Dashboard</h1>
      <h6 className="text-sm mb-4">
        This is a temporary placeholder using MakerX's AlgoKit metrics dashboard
      </h6>
      <iframe
        src="https://algokit-report.makerx.tech/"
        className="w-full h-[800px]"
        title="AlgoKit Metrics Dashboard"
      />
    </div>
  );
}
