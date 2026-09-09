export const WORKSHOP_LABS = {
  "lab-1": { file: "01-jira-lab.md", href: "/workshop", label: "Lab 1: file one ticket" },
  "lab-2": { file: "02-dev-lab.md", href: "/workshop/lab-2", label: "Lab 2: implement the ticket" },
  "lab-3": { file: "03-qa-lab.md", href: "/workshop/lab-3", label: "Lab 3: write tests" },
} as const;

export type WorkshopLabId = keyof typeof WORKSHOP_LABS;
