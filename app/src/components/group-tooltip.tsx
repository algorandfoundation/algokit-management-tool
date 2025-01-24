import { Fragment } from "react";

interface GroupTooltipProps {
  groupKey: string;
  counts: Record<string, number>;
}

export function GroupTooltip({ groupKey, counts }: GroupTooltipProps) {
  return (
    <div className="p-2 rounded-md">
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        <dt className="font-semibold">Group</dt>
        <dd>{groupKey}</dd>
        {Object.entries(counts).map(([category, count]) => (
          // Capitalize first letter and add spaces before capital letters
          <Fragment key={category}>
            <dt className="font-semibold">
              {category
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </dt>
            <dd>{count}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
