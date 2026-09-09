import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { WorkshopNav } from "@/components/WorkshopNav";
import { PageKicker } from "@/components/ui";

const ZONES = [
  ["A", "Market: KPI row and Signals"],
  ["B", "Market watchlist cards (five homes)"],
  ["C", "Conversions: rate cards and funnel"],
  ["D", "Listings: City, Active only, Days to offer sort"],
  ["E", "Listings: Search box"],
  ["F", "Demand: table, map, city chips, row detail"],
  ["G", "1842 W Maple or 1108 Peachtree (from Market)"],
  ["H", "55 Rio Grande or 902 Congress (from Market)"],
  ["I", "88 South Blvd (from Market)"],
  ["J", "Market then Conversions: compare rate names"],
];

const CREATE_TICKET_PROMPT = `You are filing one Jira ticket on project RAW for Throughline.

Site: the Throughline URL I am using
Zone: <letter>
Board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

Search RAW first for label throughline-workshop. If this issue is already filed, stop and give me that key.

Write a ticket a developer can implement: issue type Bug, summary starting with [Throughline], repro steps, expected vs actual, 2 or 3 testable acceptance criteria, priority, Track (Backend, Frontend, or Full-stack) in the description, label throughline-workshop.

Refuse a vague ticket. Ask me for a screenshot and tell me to attach it on the Jira issue page.

If Jira MCP is not available, print paste-ready markdown so I can create the issue in the RAW board UI.`;

const MCP_JSON = `{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://dconroy.atlassian.net",
        "JIRA_USERNAME": "<your-email>",
        "JIRA_API_TOKEN": "<your-token>",
        "JIRA_PROJECTS_FILTER": "RAW"
      }
    }
  }
}`;

export default function WorkshopPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <BackLink href="/">Back to market</BackLink>
        <PageKicker>Workshop</PageKicker>
        <h1 className="page-title">Lab 1 and setup</h1>
        <p className="text-[var(--muted)]">
          You do not need the GitHub repo for this page. Use the live site, Cursor, and the RAW board.
        </p>
      </header>

      <WorkshopNav />

      <section className="panel space-y-3 p-6 text-sm leading-relaxed">
        <h2 className="section-title">Links</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Throughline app:{" "}
            <Link href="/" className="text-[var(--accent)] hover:underline">
              this site
            </Link>
          </li>
          <li>
            RAW board:{" "}
            <a
              className="text-[var(--accent)] underline"
              href="https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3"
            >
              https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
            </a>
          </li>
          <li>
            Create an Atlassian API token:{" "}
            <a className="text-[var(--accent)] underline" href="https://id.atlassian.com/manage-profile/security/api-tokens">
              https://id.atlassian.com/manage-profile/security/api-tokens
            </a>
          </li>
          <li>
            Token help:{" "}
            <a
              className="text-[var(--accent)] underline"
              href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/"
            >
              Manage API tokens
            </a>
          </li>
        </ul>
      </section>

      <section className="panel space-y-3 p-6 text-sm leading-relaxed">
        <h2 className="section-title">API token and MCP</h2>
        <p>Set the Cursor chat to Agent, not Plan, not Ask.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open the RAW board. Confirm you can click Create.</li>
          <li>Open the token page. Sign in with the same Atlassian account that can see RAW.</li>
          <li>Create a token. Copy it once. You will not see it again.</li>
          <li>In Cursor, open Settings, then MCP. Add or edit a server named jira using the JSON below.</li>
          <li>Put your Atlassian email in JIRA_USERNAME.</li>
          <li>Put the token in JIRA_API_TOKEN.</li>
          <li>Leave JIRA_URL as https://dconroy.atlassian.net.</li>
          <li>Enable the server. Reload if Cursor asks.</li>
          <li>In an Agent chat, ask: List issues in project RAW. You should see a tool call and a short list.</li>
        </ol>
        <p>If this took more than 2 minutes, stop. In Lab 1 you can paste the ticket into the RAW board instead.</p>
        <pre className="overflow-auto bg-[#100d0a] p-4 text-xs text-[var(--muted)]">{MCP_JSON}</pre>
        <p>Token belongs in JIRA_API_TOKEN. Do not put it in JIRA_URL.</p>
      </section>

      <section className="panel space-y-4 p-6 text-sm leading-relaxed">
        <h2 className="section-title">Lab 1: file one ticket</h2>
        <p>Timebox: 45 to 60 minutes.</p>
        <p>
          Walk out with one RAW issue key. Pick a zone. Look for something that is obviously wrong, or two facts that
          disagree. You may ask the agent to click the site with you. Then paste the create-ticket prompt and file one
          issue.
        </p>
        <h3 className="section-title">Hunt zones</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Start here</th>
            </tr>
          </thead>
          <tbody>
            {ZONES.map(([zone, start]) => (
              <tr key={zone}>
                <td className="text-[var(--accent)]">{zone}</td>
                <td>{start}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="section-title">Create-ticket prompt</h3>
        <pre className="overflow-auto whitespace-pre-wrap bg-[#100d0a] p-4 text-xs text-[var(--muted)]">
          {CREATE_TICKET_PROMPT}
        </pre>
        <h3 className="section-title">Path C (if MCP is down)</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Ask the agent for paste-ready markdown.</li>
          <li>Open the RAW board. Click Create.</li>
          <li>Paste the summary and description.</li>
          <li>Add label throughline-workshop if the field is on the form.</li>
          <li>Create the issue. Write down the key.</li>
        </ol>
        <p>
          Done when you have a RAW key, acceptance criteria, a screenshot on the issue, and Track (Backend, Frontend, or
          Full-stack) in the description. RAW has no Track field on the form. A second ticket in the same zone is
          optional.
        </p>
      </section>
    </article>
  );
}
