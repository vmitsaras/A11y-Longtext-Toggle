import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("src/a11y-long-text-toggle.css", "dist/styles.css");
