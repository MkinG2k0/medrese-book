import { join } from "node:path";

export const DEFAULT_PROGRAM_DOCX_BASE = "d:\\Data\\Таблица шагов";

export function getProgramDocxBase() {
  return process.env.PROGRAM_DOCX_DIR ?? DEFAULT_PROGRAM_DOCX_BASE;
}

export function getLevelDocxDir(level: 1 | 2 | 3 | 4 | 5) {
  const base = getProgramDocxBase();
  const dirs: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "1й ур. .48ч",
    2: "2й. ур. 168ч",
    3: "3й. ур. 159ч",
    4: "4й. ур. 158ч",
    5: "5й ур. 37ч",
  };
  return join(base, dirs[level]);
}

export const LEVEL_TITLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "1й уровень — Буквы и слова (48ч.)",
  2: "2й уровень — Чтение сур (168ч.)",
  3: "3й уровень — Слова и чтение (159ч.)",
  4: "4й уровень — Закрепление (158ч.)",
  5: "5й уровень — Джузъ (37ч.)",
};

export const LEVEL1_PAGE_DOCX: Record<1 | 2 | 3, string> = {
  1: "1й. ур. 1стр. 48ч..docx",
  2: "1й. ур. 2стр. 48ч..docx",
  3: "1й. ур. 3стр. 48ч..docx",
};

export const LEVEL2_DOCX = "2__уровень__Все стр. _168ч..docx";

export const LEVEL3_PAGE_DOCX: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "1. 3й.ур.. 159ч..docx",
  2: "2. 3й.ур.. 159ч..docx",
  3: "3. 3й.ур.. 159ч..docx",
  4: "4. 3й.ур.. 159ч..docx",
  5: "5. 3й.ур.. 159ч..docx",
  6: "6. 3й.ур.. 159ч..docx",
};

export const LEVEL3_RULES_DOCX = "Правила 3й ур..docx";

export const LEVEL4_PAGE_DOCX: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "1. 4й.ур.. 158ч..docx",
  2: "2. 4й.ур.. 158ч..docx",
  3: "3. 4й.ур.. 158ч..docx",
  4: "4. 4й.ур.. 158ч..docx",
  5: "5. 4й.ур.. 158ч..docx",
  6: "6. 4й.ур.. 158ч..docx",
};

export const LEVEL5_PAGE_DOCX: Record<1 | 2, string> = {
  1: "1. 5й ур. 37ч..docx",
  2: "2. 5й ур. 37ч..docx",
};
