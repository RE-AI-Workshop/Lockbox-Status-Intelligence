import Link from "next/link";
import { LabOneHints } from "@/components/LabOneHints";
import { WorkshopHeader } from "@/components/WorkshopHeader";
import { WorkshopLabMarkdown } from "@/components/WorkshopLabMarkdown";
import { WorkshopNav } from "@/components/WorkshopNav";
import { readLabMarkdown } from "@/lib/lab-docs";
import { parseLabMarkdown } from "@/lib/parse-lab-markdown";
import { WORKSHOP_LABS, type WorkshopLabId } from "@/lib/workshop-labs";

export function WorkshopLabShell({ labId }: { labId: WorkshopLabId }) {
  const lab = WORKSHOP_LABS[labId];
  const { intro, sections } = parseLabMarkdown(readLabMarkdown(lab.file));
  const cloneNote =
    labId === "prerequisites"
      ? "Lab 1 uses the live site; the clone section above is optional preparation for Lab 2."
      : labId === "lab-1"
        ? "A local clone is still required to run code in Lab 2 and Lab 3."
        : "A local clone is still required to run code in this lab.";

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

      {labId === "lab-1" ? <LabOneHints /> : null}

      <p className="text-xs text-[var(--muted)]">
        Same text lives in the repo under{" "}
        <Link
          href="https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence/tree/main/docs/labs"
          className="text-[var(--accent)] underline"
        >
          docs/labs
        </Link>
        . {cloneNote}
      </p>
    </article>
  );
}
