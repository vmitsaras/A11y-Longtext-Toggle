import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourceIndex = join(root, "examples", "index.html");
const pageAssets = ["page.css", "page.js"];
const runtimeFiles = ["index.js", "styles.css"];

if (!existsSync(sourceIndex)) {
  throw new Error("Pages generation requires examples/index.html.");
}
for (const file of pageAssets) {
  if (!existsSync(join(root, "examples", file))) {
    throw new Error(`Pages generation requires examples/${file}.`);
  }
}
for (const file of runtimeFiles) {
  if (!existsSync(join(root, "dist", file))) {
    throw new Error(`Pages generation requires dist/${file}; run pages:build.`);
  }
}

const docs = join(root, "docs");
rmSync(docs, { recursive: true, force: true });
mkdirSync(docs, { recursive: true });
writeFileSync(
  join(docs, "index.html"),
  readFileSync(sourceIndex, "utf8").replaceAll("../dist/", "./dist/"),
);
for (const file of pageAssets) {
  writeFileSync(
    join(docs, file),
    readFileSync(join(root, "examples", file), "utf8").replaceAll("../dist/", "./dist/"),
  );
}
mkdirSync(join(docs, "dist"), { recursive: true });
for (const file of runtimeFiles) {
  copyFileSync(join(root, "dist", file), join(docs, "dist", file));
}

writeFileSync(join(docs, ".nojekyll"), "");

if (!existsSync(join(docs, "index.html"))) {
  throw new Error("Pages generation did not produce docs/index.html.");
}
