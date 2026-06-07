import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const DEFAULT_DOCX_DIR = "d:\\Data\\1й ур. .48ч";

export type ParsedStep = {
  order: number;
  title: string;
  lesson: string;
  letters: string;
  task: string;
  hours: number;
};

const PAGE_DOCX_NAMES: Record<1 | 2 | 3, string> = {
  1: "1й. ур. 1стр. 48ч..docx",
  2: "1й. ур. 2стр. 48ч..docx",
  3: "1й. ур. 3стр. 48ч..docx",
};

export const LEVEL1_TITLE = "1й уровень — Буквы и слова (48ч.)";
export const LEVEL2_TITLE = "2й уровень — Буквы и слова (48ч.)";

type RawStep = {
  order: number;
  lesson: string;
  letters: string;
  task: string;
  hours: number;
};

function getDocxDir() {
  return process.env.LEVEL1_DOCX_DIR ?? DEFAULT_DOCX_DIR;
}

export function getLevel1DocxPath(page: 1 | 2 | 3) {
  return join(getDocxDir(), PAGE_DOCX_NAMES[page]);
}

function readDocxDocumentXml(docxPath: string): string {
  const dir = mkdtempSync(join(tmpdir(), "medrese-docx-"));
  try {
    copyFileSync(docxPath, join(dir, "archive.zip"));
    execSync("tar -xf archive.zip", { cwd: dir, stdio: "ignore" });
    return readFileSync(join(dir, "word/document.xml"), "utf8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function cellText(cellXml: string): string {
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

function parseDocumentXml(xml: string): RawStep[] {
  const rows = [...xml.matchAll(/<w:tr[\s>][\s\S]*?<\/w:tr>/g)].map(
    (match) => match[0],
  );

  const steps: RawStep[] = [];

  for (const row of rows.slice(1)) {
    const cells = [...row.matchAll(/<w:tc[\s>][\s\S]*?<\/w:tc>/g)].map((match) =>
      cellText(match[0]),
    );

    if (cells.length < 5) continue;

    const order = Number.parseInt(cells[0]!.replace(/\D/g, ""), 10);
    if (!Number.isFinite(order) || order <= 0) continue;

    steps.push({
      order,
      lesson: cells[1] ?? "",
      letters: cells[2] ?? "",
      task: cells[3] ?? "",
      hours: Number.parseInt(cells[4]!, 10) || 1,
    });
  }

  return steps;
}

export function parseLevel1DocxPage(page: 1 | 2 | 3): ParsedStep[] {
  const docxPath = getLevel1DocxPath(page);

  if (!existsSync(docxPath)) {
    throw new Error(
      `DOCX не найден: ${docxPath}. Задайте LEVEL1_DOCX_DIR или положите файлы в ${DEFAULT_DOCX_DIR}`,
    );
  }

  const xml = readDocxDocumentXml(docxPath);
  return parseDocumentXml(xml).map((step) => ({
    ...step,
    title: step.task,
  }));
}

export function parseAllLevel1DocxPages(): ParsedStep[] {
  return ([1, 2, 3] as const).flatMap((page) => parseLevel1DocxPage(page));
}
