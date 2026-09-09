import { BackLink } from "@/components/BackLink";
import { PageKicker } from "@/components/ui";

export function WorkshopHeader({ title, lede }: { title: string; lede: string }) {
  return (
    <header className="space-y-3">
      <BackLink href="/">Back to market</BackLink>
      <PageKicker>Workshop</PageKicker>
      <h1 className="page-title">{title}</h1>
      <p className="text-[var(--muted)]">{lede}</p>
    </header>
  );
}
