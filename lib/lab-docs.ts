import fs from "node:fs";
import path from "node:path";

const LAB_DIR = path.join(process.cwd(), "docs/labs");

export function readLabMarkdown(filename: string): string {
  return fs.readFileSync(path.join(LAB_DIR, filename), "utf8");
}
