export type LabSection = {
  title: string;
  content: string;
};

export function parseLabMarkdown(source: string): { intro: string; sections: LabSection[] } {
  const withoutTitle = source.replace(/^#\s+.+\n+/, "");
  const firstHeading = withoutTitle.search(/\n## /);

  const intro = firstHeading === -1 ? withoutTitle.trim() : withoutTitle.slice(0, firstHeading).trim();
  const rest = firstHeading === -1 ? "" : withoutTitle.slice(firstHeading + 1);

  const sections = rest
    .split(/\n(?=## )/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^## (.+)\n([\s\S]*)$/);
      if (!match) return { title: "Section", content: block };
      return { title: match[1].trim(), content: match[2].trim() };
    });

  return { intro, sections };
}
