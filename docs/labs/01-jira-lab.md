# Lab 1: file one ticket

Timebox: 45 to 60 minutes.

This is a human hunt. You look at the live site. The agent helps you write and file one ticket. You do not need the GitHub repo.

Walk out with one RAW issue key.

Set the Cursor chat to **Agent**, not Plan, not Ask.

## Links

- Throughline app: https://lockbox-status-intelligence.vercel.app
- Workshop (Lab 1): https://lockbox-status-intelligence.vercel.app/workshop
- Lab 2: https://lockbox-status-intelligence.vercel.app/workshop/lab-2
- Lab 3: https://lockbox-status-intelligence.vercel.app/workshop/lab-3
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
- Create an Atlassian API token: https://id.atlassian.com/manage-profile/security/api-tokens

The Workshop page on the site has the same setup steps and the same create-ticket prompt if you would rather stay in the browser.

## 1. Pick a hunt zone

Pick a letter. Start on that page or control. If that zone is already filed on RAW, try another tell in the same zone, or move one letter over.

| Zone | Start here |
| --- | --- |
| A | Market (`/`): KPI row and Signals |
| B | Market watchlist cards (five homes) |
| C | Conversions: three rate cards and funnel |
| D | Listings: City filter, Active only, Days to offer sort |
| E | Listings: Search box (placeholder is a hint) |
| F | Demand: Demand by ZIP table, map, city chips, row detail panel |
| G | Watchlist: 1842 W Maple or 1108 Peachtree (open from Market) |
| H | Watchlist: 55 Rio Grande or 902 Congress (open from Market) |
| I | Watchlist: 88 South Blvd (open from Market) |
| J | Market then Conversions: compare the same rate names |

## 2. Look before you file

Click the zone. Look for something that is obviously wrong, or two facts that disagree.

You may ask the agent to open the Throughline URL and click that zone with you. You can also take your own screenshot.

Stay on the live site. Do not open application source.

## 3. File one ticket

Paste the prompt below into an Agent chat. Fill in the Throughline URL and your zone letter. Tell the agent what you saw.

```
You are filing one Jira ticket on project RAW for Throughline.

Site: the Throughline URL I am using
Zone: <letter>
Board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

Search RAW first for label throughline-workshop. If this issue is already filed, stop and give me that key.

Write a ticket a developer can implement: issue type Bug, summary starting with [Throughline], repro steps, expected vs actual, 2 or 3 testable acceptance criteria, priority, Track (Backend, Frontend, or Full-stack) in the description, label throughline-workshop.

Refuse a vague ticket. Ask me for a screenshot and tell me to attach it on the Jira issue page.

If Jira MCP is not available, print paste-ready markdown so I can create the issue in the RAW board UI.
```

If slash commands are available later in the repo, this same job is `/create-jira-ticket`. In this lab, paste the text.

### What a usable ticket looks like

Use this as the shape, not as a Throughline bug to file:

- Summary: `[Throughline] Save search on Listings does nothing`
- Repro: open Listings, type a city, click Save search
- Expected: the query is stored and still there after refresh
- Actual: the button does not persist the query
- Acceptance criteria: 2 or 3 checks a developer can click
- Track: Frontend
- Label: `throughline-workshop`

### Path C (if MCP is down)

1. Ask the agent for paste-ready markdown.
2. Open the RAW board. Click **Create**.
3. Paste the summary and description.
4. Add label `throughline-workshop` if the field is on the form.
5. Create the issue. Write down the key (`RAW-NN`).

If you cannot click Create, raise a hand. Do not spend the lab on permissions.

## 4. Attach a screenshot

Open the new issue on the RAW board. Drag a screenshot onto the issue. Do not wait for MCP to upload it.

## Done when

- You have a RAW key written down.
- The ticket has repro steps, expected vs actual, and 2 or 3 acceptance criteria.
- A screenshot is on the issue.
- Track (Backend, Frontend, or Full-stack) is in the description. RAW has no Track field on the form.

A second Lab 1 style ticket in the same zone is optional. Stop at one if time is tight.
