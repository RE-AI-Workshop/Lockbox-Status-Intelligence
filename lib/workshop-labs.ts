export const WORKSHOP_LABS = {
  "lab-1": {
    file: "01-jira-lab.md",
    href: "/workshop",
    label: "Lab 1: file one ticket",
    title: "Lab 1: file one ticket",
    lede: "Find something wrong on the live site, write it up, and file one RAW ticket. You do not need the repo yet.",
  },
  "lab-2": {
    file: "02-dev-lab.md",
    href: "/workshop/lab-2",
    label: "Lab 2: implement the ticket",
    title: "Lab 2: implement the ticket",
    lede: "Clone the repo, run it on your laptop, and fix the ticket you filed in Lab 1. Keep the change local.",
  },
  "lab-3": {
    file: "03-qa-lab.md",
    href: "/workshop/lab-3",
    label: "Lab 3: write tests",
    title: "Lab 3: write tests",
    lede: "Write automated checks for the same ticket. Run tests against localhost, not the shared demo site.",
  },
} as const;

export type WorkshopLabId = keyof typeof WORKSHOP_LABS;
