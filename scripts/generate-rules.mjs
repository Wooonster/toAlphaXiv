import { writeFile } from "node:fs/promises";
import { buildRedirectRules } from "../lib/rules.js";

await writeFile(
  new URL("../rules.json", import.meta.url),
  `${JSON.stringify(buildRedirectRules(), null, 2)}\n`,
  "utf8"
);
