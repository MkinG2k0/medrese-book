import "dotenv/config";

import { syncLevel1JsonFromDocx } from "./lib/level1-import-utils";

syncLevel1JsonFromDocx();
console.log("JSON-кэш level1-page1..3 обновлён из DOCX");
