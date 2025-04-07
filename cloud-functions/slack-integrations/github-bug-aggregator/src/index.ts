import axios from "axios";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import * as functions from "@google-cloud/functions-framework";

// Define types for GitHub and Slack data
interface GitHubIssue {
  title: string;
  html_url: string;
  repository_url: string;
  user: {
    login: string;
  };
  created_at: string;
  labels: Array<{
    name: string;
  }>;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
}
// Configuration for repositories to monitor
interface RepoConfig {
  owner: string;
  name: string;
}

const ALGOKIT_REPO_OWNER = "algorandfoundation";
const REPOSITORIES: RepoConfig[] = [
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-cli" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-utils-py" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-utils-ts" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-client-generator-py" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-client-generator-ts" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-subscriber-py" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-subscriber-ts" },
  { owner: ALGOKIT_REPO_OWNER, name: "puya" },
  { owner: ALGOKIT_REPO_OWNER, name: "algorand-python-testing" },
  { owner: ALGOKIT_REPO_OWNER, name: "algorand-typescript-testing" },
  { owner: ALGOKIT_REPO_OWNER, name: "puya-ts" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-lora" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-avm-vscode-debugger" },
  { owner: ALGOKIT_REPO_OWNER, name: "algokit-utils-ts-debug" },
];

async function getSecret(secretName: string): Promise<string> {
  try {
    const client = new SecretManagerServiceClient();
    const name = `projects/algokit/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    return version.payload?.data?.toString() || "";
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw new Error(`Failed to access secret ${secretName}`);
  }
}

async function getGitHubIssues(): Promise<GitHubIssue[]> {
  try {
    const githubToken = await getSecret("github-token");

    const repoQueries = REPOSITORIES.map(
      (repo) => `repo:${repo.owner}/${repo.name}`
    ).join(" ");

    // Get issues from GitHub API
    const response = await axios.get("https://api.github.com/search/issues", {
      params: {
        q: `is:issue is:open label:bug ${repoQueries}`,
        sort: "created",
        order: "desc",
      },
      headers: {
        Authorization: `token ${githubToken}`,
      },
    });

    return response.data.items as GitHubIssue[];
  } catch (error) {
    console.error("Error fetching GitHub issues:", error);
    return [];
  }
}

async function postToSlack(issues: GitHubIssue[]): Promise<void> {
  if (!issues.length) {
    console.log("No issues to report");
    return;
  }

  // Format the message
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📊 Daily GitHub Bugs Report",
      },
    },
    {
      type: "divider",
    },
  ];

  // Add each issue to the message
  issues.forEach((issue) => {
    // Extract repo name from repository_url
    const repoName = issue.repository_url.split("/").slice(-2).join("/");

    // Format date
    const createdDate = new Date(issue.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${issue.html_url}|${issue.title}>*\n${repoName} • Created by ${issue.user.login} on ${createdDate}`,
      },
    });

    // Add a small divider between issues
    if (issues.indexOf(issue) < issues.length - 1) {
      blocks.push({
        type: "divider",
      });
    }
  });

  try {
    // Get Slack webhook URL from Secret Manager
    const webhookUrl = await getSecret("slack-webhook-url");
    if (!webhookUrl) {
      throw new Error(
        "Failed to retrieve Slack webhook URL from Secret Manager"
      );
    }

    await axios.post(webhookUrl, { blocks });
    console.log(`Successfully posted ${issues.length} issues to Slack`);
  } catch (error) {
    console.error("Error posting to Slack:", error);
  }
}

// Main function
async function createDailyReport(): Promise<void> {
  try {
    console.log("Fetching GitHub issues...");
    const issues = await getGitHubIssues();
    console.log(`Found ${issues.length} issues`);

    console.log("Posting to Slack...");
    await postToSlack(issues);

    console.log("Daily report complete");
  } catch (error) {
    console.error(
      "Error creating daily report:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Cloud Function handler
functions.http(
  "githubBugAggregator",
  async (req: functions.Request, res: functions.Response): Promise<void> => {
    try {
      await createDailyReport();
      res.status(200).send("Report generated successfully");
    } catch (error) {
      console.error("Failed to generate report:", error);
      res.status(500).send("Failed to generate report");
    }
  }
);
