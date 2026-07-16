/**
 * One-shot: книга учителя (33 docx) → level1-teacher-notes.json + media.
 *
 * Usage:
 *   pnpm db:import:level1-teacher
 *   pnpm db:import:level1-teacher -- --source "D:\\path\\to\\Книга учителя"
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";

import JSZip from "jszip";
import sharp from "sharp";

import { hasArabic } from "./lib/program-import-utils";

const DEFAULT_SOURCE =
  "D:\\Data\\Таблица шагов\\1й ур. .48ч\\1 уровень 1.12.25г\\Книга учителя";

const STEP_FILE_RE = /^(\d+)й\s+шаг/i;
const MIN_MEDIA_BYTES = 2048;
const OUT_JSON = join(process.cwd(), "prisma/data/level1-teacher-notes.json");
const OUT_MEDIA_ROOT = join(process.cwd(), "public/uploads/program/level1");

type ContentBlock =
  | { type: "text"; value: string }
  | { type: "arabic"; value: string; size?: "md" | "lg" | "xl" }
  | { type: "image"; url: string; caption?: string | null }
  | { type: "list"; items: string[] };

type TeacherNoteEntry = {
  order: number;
  teacherNote: { blocks: ContentBlock[] };
};

function parseSourceArg(argv: string[]): string {
  const idx = argv.indexOf("--source");
  if (idx >= 0 && argv[idx + 1]) {
    return resolve(argv[idx + 1]!);
  }
  return DEFAULT_SOURCE;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Drawing extents / Word field junk — почти только цифры и единицы измерения. */
function isGarbageText(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length <= 2 && /^\d+$/.test(t)) return true;
  // "123456", "0", "cx=...", EMU sizes
  if (/^[\d\s.,;:x×*\-+/=cmптemu]+$/i.test(t) && /\d/.test(t)) {
    const letters = t.replace(/[\d\s.,;:x×*\-+/=]/g, "");
    if (letters.length <= 3) return true;
  }
  if (/^(PAGE|NUMPAGES|TOC|HYPERLINK|REF|SEQ)\b/i.test(t)) return true;
  if (/^[\s\u00a0\u200b\u200c\u200d\ufeff]+$/.test(t)) return true;
  return false;
}

function parseRels(relsXml: string): Map<string, string> {
  const map = new Map<string, string>();
  const re =
    /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(relsXml))) {
    const id = m[1]!;
    let target = m[2]!.replace(/\\/g, "/");
    if (target.startsWith("/")) target = target.slice(1);
    if (!target.startsWith("media/") && !target.includes("/media/")) {
      // only image targets matter; keep all for safety
    }
    if (target.startsWith("media/")) {
      map.set(id, `word/${target}`);
    } else if (target.includes("media/")) {
      map.set(id, target.startsWith("word/") ? target : `word/${target}`);
    }
  }
  // Also catch Target before Id order
  const re2 =
    /<Relationship\b[^>]*\bTarget="([^"]+)"[^>]*\bId="([^"]+)"[^>]*\/?>/g;
  while ((m = re2.exec(relsXml))) {
    const targetRaw = m[1]!.replace(/\\/g, "/");
    const id = m[2]!;
    if (map.has(id)) continue;
    let target = targetRaw;
    if (target.startsWith("media/")) map.set(id, `word/${target}`);
    else if (target.includes("media/")) {
      map.set(id, target.startsWith("word/") ? target : `word/${target}`);
    }
  }
  return map;
}

function extractParagraphText(pXml: string): string {
  const parts: string[] = [];
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pXml))) {
    parts.push(decodeXmlEntities(m[1]!));
  }
  return parts.join("").replace(/\s+/g, " ").trim();
}

function extractEmbedIds(fragment: string): string[] {
  const ids: string[] = [];
  const re = /(?:r:embed|r:link)="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fragment))) {
    ids.push(m[1]!);
  }
  return ids;
}

function hasMagick(): boolean {
  try {
    execFileSync("magick", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    try {
      execFileSync("convert", ["-version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

async function convertEmf(
  inputPath: string,
  outputPng: string,
): Promise<boolean> {
  try {
    execFileSync("magick", [inputPath, outputPng], { stdio: "ignore" });
    return existsSync(outputPng);
  } catch {
    try {
      execFileSync("convert", [inputPath, outputPng], { stdio: "ignore" });
      return existsSync(outputPng);
    } catch {
      return false;
    }
  }
}

type MediaResult = {
  /** rId → public URL path or null if skipped */
  urlByRid: Map<string, string | null>;
  emfSkipped: number;
  imagesSaved: number;
};

async function extractMedia(
  zip: JSZip,
  rels: Map<string, string>,
  stepOrder: number,
  magickAvailable: boolean,
): Promise<MediaResult> {
  const stepDir = join(OUT_MEDIA_ROOT, `step-${stepOrder}`);
  mkdirSync(stepDir, { recursive: true });

  const urlByRid = new Map<string, string | null>();
  let emfSkipped = 0;
  let imagesSaved = 0;

  const usedTargets = new Set(rels.values());

  for (const [rid, zipPath] of rels) {
    const file = zip.file(zipPath);
    if (!file) {
      urlByRid.set(rid, null);
      continue;
    }

    const buf = await file.async("nodebuffer");
    const base = basename(zipPath);
    const ext = extname(base).toLowerCase();

    if (buf.length < MIN_MEDIA_BYTES && ext !== ".svg") {
      // tiny chrome (icons, bullets) — skip unless SVG educational
      urlByRid.set(rid, null);
      continue;
    }

    if (ext === ".emf" || ext === ".wmf") {
      const tmpEmf = join(stepDir, base);
      if (magickAvailable) {
        writeFileSync(tmpEmf, buf);
        const pngName = base.replace(/\.(emf|wmf)$/i, ".png");
        const pngPath = join(stepDir, pngName);
        const ok = await convertEmf(tmpEmf, pngPath);
        try {
          rmSync(tmpEmf, { force: true });
        } catch {
          /* ignore */
        }
        if (ok) {
          const url = `/uploads/program/level1/step-${stepOrder}/${pngName}`;
          urlByRid.set(rid, url);
          imagesSaved += 1;
        } else {
          console.warn(
            `[step ${stepOrder}] EMF skip (convert failed): ${base}`,
          );
          emfSkipped += 1;
          urlByRid.set(rid, null);
        }
      } else {
        console.warn(
          `[step ${stepOrder}] EMF skip (no ImageMagick): ${base}`,
        );
        emfSkipped += 1;
        urlByRid.set(rid, null);
      }
      continue;
    }

    if (ext === ".svg") {
      const pngName = base.replace(/\.svg$/i, ".png");
      const pngPath = join(stepDir, pngName);
      try {
        await sharp(buf).png().toFile(pngPath);
        const url = `/uploads/program/level1/step-${stepOrder}/${pngName}`;
        urlByRid.set(rid, url);
        imagesSaved += 1;
      } catch (err) {
        console.warn(
          `[step ${stepOrder}] SVG→PNG failed for ${base}:`,
          err instanceof Error ? err.message : err,
        );
        // fallback: keep SVG file but BlockRenderer may not render it
        writeFileSync(join(stepDir, base), buf);
        urlByRid.set(
          rid,
          `/uploads/program/level1/step-${stepOrder}/${base}`,
        );
        imagesSaved += 1;
      }
      continue;
    }

    if ([".png", ".jpeg", ".jpg", ".gif", ".webp"].includes(ext)) {
      writeFileSync(join(stepDir, base), buf);
      urlByRid.set(
        rid,
        `/uploads/program/level1/step-${stepOrder}/${base}`,
      );
      imagesSaved += 1;
      continue;
    }

    console.warn(`[step ${stepOrder}] unsupported media skipped: ${base}`);
    urlByRid.set(rid, null);
  }

  // Ensure unused media listing doesn't leave orphan EMF on disk
  void usedTargets;

  return { urlByRid, emfSkipped, imagesSaved };
}

function buildBlocks(
  documentXml: string,
  urlByRid: Map<string, string | null>,
): ContentBlock[] {
  const bodyMatch = documentXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/i);
  const body = bodyMatch?.[1] ?? documentXml;

  // Walk top-level paragraphs in document order
  const blocks: ContentBlock[] = [];
  const seenUrls = new Set<string>();

  const pRe = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRe.exec(body))) {
    const pXml = pMatch[0]!;

    const text = extractParagraphText(pXml);
    const embeds = extractEmbedIds(pXml);

    for (const rid of embeds) {
      const url = urlByRid.get(rid);
      if (!url || seenUrls.has(url)) continue;
      seenUrls.add(url);
      blocks.push({ type: "image", url });
    }

    if (text && !isGarbageText(text)) {
      if (hasArabic(text)) {
        blocks.push({ type: "arabic", value: text, size: "lg" });
      } else {
        blocks.push({ type: "text", value: text });
      }
    }
  }

  return blocks;
}

async function importStep(
  filePath: string,
  order: number,
  magickAvailable: boolean,
): Promise<{
  entry: TeacherNoteEntry;
  emfSkipped: number;
  imagesSaved: number;
  imageBlocks: number;
}> {
  const zip = await JSZip.loadAsync(readFileSync(filePath));
  const docFile = zip.file("word/document.xml");
  const relsFile = zip.file("word/_rels/document.xml.rels");
  if (!docFile || !relsFile) {
    throw new Error(`Invalid docx (missing document.xml): ${filePath}`);
  }

  const documentXml = await docFile.async("string");
  const relsXml = await relsFile.async("string");
  const rels = parseRels(relsXml);

  const media = await extractMedia(zip, rels, order, magickAvailable);
  const blocks = buildBlocks(documentXml, media.urlByRid);

  return {
    entry: { order, teacherNote: { blocks } },
    emfSkipped: media.emfSkipped,
    imagesSaved: media.imagesSaved,
    imageBlocks: blocks.filter((b) => b.type === "image").length,
  };
}

async function main() {
  const sourceDir = parseSourceArg(process.argv.slice(2));
  if (!existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  const magickAvailable = hasMagick();
  console.log(`Source: ${sourceDir}`);
  console.log(`ImageMagick: ${magickAvailable ? "yes" : "no (EMF will skip)"}`);

  mkdirSync(OUT_MEDIA_ROOT, { recursive: true });

  const allFiles = readdirSync(sourceDir);
  const stepFiles: Array<{ order: number; name: string }> = [];
  for (const name of allFiles) {
    if (!name.toLowerCase().endsWith(".docx")) continue;
    const m = STEP_FILE_RE.exec(basename(name));
    if (!m) {
      console.log(`Skip non-step docx: ${name}`);
      continue;
    }
    stepFiles.push({ order: Number(m[1]), name });
  }

  stepFiles.sort((a, b) => a.order - b.order);

  if (stepFiles.length !== 33) {
    console.warn(
      `Expected 33 step files, found ${stepFiles.length}`,
    );
  }

  const entries: TeacherNoteEntry[] = [];
  let totalEmfSkipped = 0;
  let totalImagesSaved = 0;
  let totalImageBlocks = 0;

  for (const { order, name } of stepFiles) {
    const result = await importStep(
      join(sourceDir, name),
      order,
      magickAvailable,
    );
    entries.push(result.entry);
    totalEmfSkipped += result.emfSkipped;
    totalImagesSaved += result.imagesSaved;
    totalImageBlocks += result.imageBlocks;
    console.log(
      `Step ${order}: blocks=${result.entry.teacherNote.blocks.length}, images=${result.imageBlocks}, emfSkipped=${result.emfSkipped}`,
    );
  }

  entries.sort((a, b) => a.order - b.order);
  writeFileSync(OUT_JSON, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  console.log("---");
  console.log(`Wrote ${entries.length} steps → ${OUT_JSON}`);
  console.log(`Media root: ${OUT_MEDIA_ROOT}`);
  console.log(`Images saved: ${totalImagesSaved}`);
  console.log(`Image blocks: ${totalImageBlocks}`);
  console.log(`EMF skipped: ${totalEmfSkipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
