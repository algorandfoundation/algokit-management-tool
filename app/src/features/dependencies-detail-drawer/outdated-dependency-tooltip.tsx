import { TooltipData } from "./outdated-dependencies-graph";

export function OutdatedDependencyTooltip({
  name,
  majorCount,
  minorCount,
  smallCount,
  outdatedPatchCount,
}: TooltipData) {
  return (
    <div className="p-2 rounded-md  ">
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        <dt className="font-semibold">Name</dt>
        <dd>{name}</dd>
        <dt className="font-semibold">Major Updates</dt>
        <dd>{majorCount}</dd>
        <dt className="font-semibold">Minor Updates</dt>
        <dd>{minorCount}</dd>
        <dt className="font-semibold">Small Updates</dt>
        <dd>{smallCount}</dd>
        <dt className="font-semibold">Patch Updates</dt>
        <dd>{outdatedPatchCount}</dd>
      </dl>
    </div>
  );
}
