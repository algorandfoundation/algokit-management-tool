import { BaseNodeData } from "../tree/types";

interface FuncSpecsMarkdownProps {
  data: BaseNodeData[];
}

const getLevel = (specId: string): number => {
  return specId.split(".").length;
};

interface HeadingProps {
  text: string;
  specId: string;
}

const SpecHeading = ({ text, specId }: HeadingProps) => {
  const level = getLevel(specId);
  const safeLevel = Math.min(Math.max(level, 1), 6);
  const HeadingTag = `h${safeLevel}` as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag>
      {specId} {text}
    </HeadingTag>
  );
};

export function FuncSpecsMarkdown({ data }: FuncSpecsMarkdownProps) {
  return (
    <div className="p-4 space-y-4 prose">
      {data.map((item) => (
        <div key={item.specId}>
          <SpecHeading text={item.name} specId={item.specId} />
          {item.description && (
            <p className="text-base-content/80 mb-4">{item.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
