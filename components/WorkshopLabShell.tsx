import Link from "next/link";
import { WorkshopHeader } from "@/components/WorkshopHeader";
import { WorkshopLabMarkdown } from "@/components/WorkshopLabMarkdown";
import { WorkshopNav } from "@/components/WorkshopNav";
import { readLabMarkdown } from "@/lib/lab-docs";
import { parseLabMarkdown } from "@/lib/parse-lab-markdown";
import { WORKSHOP_LABS, type WorkshopLabId } from "@/lib/workshop-labs";

export function WorkshopLabShell({ labId }: { labId: WorkshopLabId }) {
  const lab = WORKSHOP_LABS[labId];
  const { intro, sections } = parseLabMarkdown(readLabMarkdown(lab.file));

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <WorkshopHeader title={lab.title} lede={lab.lede} />
      <WorkshopNav />

      {intro ? (
        <section className="panel space-y-3 p-6 text-sm leading-relaxed">
          <WorkshopLabMarkdown source={intro} />
        </section>
      ) : null}

      {sections.map((section) => (
        <section key={section.title} className="panel space-y-3 p-6 text-sm leading-relaxed">
          <h2 className="section-title">{section.title}</h2>
          <WorkshopLabMarkdown source={section.content} />
        </section>
      ))}

      <p className="text-xs text-[var(--muted)]">
        Same text lives in the repo under{" "}
        <Link
          href="https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence/tree/main/docs/labs"
          className="text-[var(--accent)] underline"
        >
          docs/labs
        </Link>
        . {labId === "lab-1" ? "Lab 2 and Lab 3" : "This lab"} still require a local clone to run code.
      </p>
    </article>
  );
}
