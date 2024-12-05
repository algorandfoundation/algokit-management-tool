import { createLazyFileRoute } from "@tanstack/react-router";
import Tree from "../features/tree/Tree";
import { useScreenSize } from "@visx/responsive";
import { useEffect, useState } from "react";

export const Route = createLazyFileRoute("/func-specs")({
  component: RouteComponent,
});

function RouteComponent() {
  const { width, height } = useScreenSize();
  const [data, setData] = useState(null);

  useEffect(() => {
    import("./tree_data.json").then((m) => {
      // @ts-expect-error - imported JSON structure doesn't match expected type
      setData(m.default);
    });
  }, []);

  if (!data || width === 0 || height === 0) return null;
  return (
    <div>
      <Tree data={data} width={width} height={height + 300} />
    </div>
  );
}
