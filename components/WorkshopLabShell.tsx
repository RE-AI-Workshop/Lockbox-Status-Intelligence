import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { WorkshopLabMarkdown } from "@/components/WorkshopLabMarkdown";
import { WorkshopNav } from "@/components/WorkshopNav";
import { PageKicker } from "@/components/ui";
import { readLabMarkdown } from "@/lib/lab-docs";

export function WorkshopLabShell({ file, kicker }: { file: string; kicker: string }) {
  const source = readLabMarkdown(file);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <BackLink href="/">Back to market</BackLink>
        <PageKicker>Workshop</PageKicker>
        <p className="text-sm text-[var(--muted)]">{kicker}</p>
      </header>
      <WorkshopNav />
      <WorkshopLabMarkdown source={source} />
      <p className="text-xs text-[var(--muted)]">
        Same text lives in the repo under{" "}
        <Link href="https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence/tree/main/docs/labs" className="text-[var(--accent)] underline">
          docs/labs
        </Link>
        . Lab 2 and Lab 3 still require a local clone to run code.
      </p>
    </div>
  );
}
