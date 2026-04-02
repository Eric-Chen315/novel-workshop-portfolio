const fs = require("node:fs");
const path = require("node:path");
const { ESLint } = require("eslint");

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const filePath = path.join(
    projectRoot,
    "app",
    "projects",
    "[id]",
    "knowledge",
    "components",
    "OutlineManager.tsx",
  );
  const configPath = path.join(projectRoot, "eslint.config.mjs");
  const text = fs.readFileSync(filePath, "utf8");

  const eslint = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: configPath,
  });

  const results = await eslint.lintText(text, { filePath });
  const formatter = await eslint.loadFormatter("stylish");
  const output = formatter.format(results);
  process.stdout.write(output || "ESLint passed\n");
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});