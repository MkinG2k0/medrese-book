import "dotenv/config";

import { syncProgramJsonFromDocxWithReport } from "./lib/program-import-utils";

const report = syncProgramJsonFromDocxWithReport();

console.log("JSON-кэш программы обновлён из DOCX:");
console.log(`  Уровень 1: ${report.level1.join(" + ")} = ${report.level1.reduce((a, b) => a + b, 0)} шагов`);
console.log(`  Уровень 2: ${report.level2} шагов`);
console.log(`  Уровень 3: ${report.level3.join(" + ")} = ${report.level3.reduce((a, b) => a + b, 0)} шагов`);
console.log(`  Правила 3 ур.: ${report.level3Rules} записей`);
console.log(`  Уровень 4: ${report.level4.join(" + ")} = ${report.level4.reduce((a, b) => a + b, 0)} шагов`);
console.log(`  Уровень 5: ${report.level5.join(" + ")} = ${report.level5.reduce((a, b) => a + b, 0)} шагов`);
