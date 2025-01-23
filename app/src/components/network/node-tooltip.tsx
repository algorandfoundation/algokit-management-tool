import { Node } from "./types";

export function NodeTooltip({ node }: { node: Node }) {
  return (
    <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
      <dt className="font-semibold">Name</dt>
      <dd>{node.name}</dd>
      <dt className="font-semibold">Version(s)</dt>
      <dd className="flex flex-col">
        {node.version.map((v, i) => (
          <div key={i}>
            {v.repo_name}: {v.version}
          </div>
        ))}
      </dd>
      <dt className="font-semibold">Owner</dt>
      <dd>{node.owner}</dd>
      <dt className="font-semibold">Language</dt>
      <dd>{node.language}</dd>
      <dt className="font-semibold">Type</dt>
      <dd>{node.type}</dd>
    </dl>
  );
}
