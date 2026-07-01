import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

export function readDocxDocumentXml(docxPath: string): string {
  const dir = mkdtempSync(join(tmpdir(), "medrese-docx-"));
  try {
    copyFileSync(docxPath, join(dir, "archive.zip"));
    execSync("tar -xf archive.zip", { cwd: dir, stdio: "ignore" });
    return readFileSync(join(dir, "word/document.xml"), "utf8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function cellText(cellXml: string): string {
  const paragraphs = cellXml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) ?? [];
  return paragraphs
    .map((paragraph) => {
      const runs = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
      return runs.map((match) => match[1]).join("");
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTableRows(xml: string): string[][] {
  const rows = [...xml.matchAll(/<w:tr[\s>][\s\S]*?<\/w:tr>/g)].map(
    (match) => match[0],
  );

  return rows.map((row) =>
    [...row.matchAll(/<w:tc[\s>][\s\S]*?<\/w:tc>/g)].map((match) =>
      cellText(match[0]),
    ),
  );
}

export function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
