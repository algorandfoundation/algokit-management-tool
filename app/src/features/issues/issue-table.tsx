import { DataTable } from "@/components/table/data-table";
import { IssueOrPullRequest } from "@/types/issues";

const columnDefs = [
  {
    id: "number",
    header: "#",
    accessorKey: "number",
    size: 80,
    cell: ({ row }) => (
      <a
        href={row.original.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="link link-primary"
      >
        {row.original.number}
      </a>
    ),
  },
  {
    id: "repository",
    header: "Repository",
    accessorKey: "repository",
    size: 200,
  },
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
    size: 300,
  },
  {
    id: "state",
    header: "State",
    accessorKey: "state",
    size: 100,
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-sm ${
          row.original.state === "open"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.state}
      </span>
    ),
  },
  {
    id: "type",
    header: "Type",
    size: 100,
    cell: ({ row }) => (
      <span className="text-gray-600">
        {row.original.isPullRequest ? "PR" : "Issue"}
      </span>
    ),
  },
  {
    id: "author",
    header: "Author",
    accessorKey: "author",
    size: 150,
  },
  {
    id: "createdAt",
    header: "Created",
    accessorKey: "createdAt",
    size: 150,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "commentsCount",
    header: "Comments",
    accessorKey: "commentsCount",
    size: 100,
  },
];

interface IssueTableProps {
  data: IssueOrPullRequest[];
}

interface TableData {
  id: string;
  number: number;
  repository: string;
  title: string;
  htmlUrl: string;
  state: string;
  isPullRequest: boolean;
  author: string;
  createdAt: string;
  commentsCount: number;
}

const transformToTableData = (data: IssueOrPullRequest[]): TableData[] => {
  return data.map((issue) => ({
    id: issue.number.toString(),
    number: issue.number,
    repository: issue.repository,
    title: issue.title,
    htmlUrl: issue.htmlUrl,
    state: issue.state,
    isPullRequest: issue.isPullRequest,
    author: issue.author,
    createdAt: issue.createdAt,
    commentsCount: issue.commentsCount,
  }));
};

export function IssueTable({ data }: IssueTableProps) {
  const tableData = transformToTableData(data);
  return <DataTable<TableData> columnDefs={columnDefs} data={tableData} />;
}
