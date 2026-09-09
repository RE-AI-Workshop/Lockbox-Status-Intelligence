export const WORKSHOP_LABS = {
  "lab-1": {
    file: "01-jira-lab.md",
    href: "/workshop",
    label: "Lab 1: file one ticket",
    title: "Lab 1 and setup",
    lede: "You do not need the GitHub repo for this page. Use the live site, Cursor, and the RAW board.",
  },
  "lab-2": {
    file: "02-dev-lab.md",
    href: "/workshop/lab-2",
    label: "Lab 2: implement the ticket",
    title: "Lab 2: implement the ticket",
    lede: "Clone the repo, run it on your laptop, and fix one RAW ticket. Do not push or deploy over the shared site.",
  },
  "lab-3": {
    file: "03-qa-lab.md",
    href: "/workshop/lab-3",
    label: "Lab 3: write tests",
    title: "Lab 3: write tests",
    lede: "Add automated checks for the same RAW ticket you fixed in Lab 2. Tests run against localhost, not this site.",
  },
} as const;

export type WorkshopLabId = keyof typeof WORKSHOP_LABS;
