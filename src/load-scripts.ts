import path from "node:path";
import { existsSync } from "fs";
import type { RunnerScript } from "../src";
import { readdir } from "node:fs/promises";

type Script = {
 name: string;
 path: string;
};

export const getScriptsDirectory = (customPath?: string) => {
 return customPath || path.join(process.cwd(), "./scripts");
};

export const loadScripts = async (): Promise<Script[]> => {
 const scriptsDir = getScriptsDirectory();

 if (!existsSync(scriptsDir)) {
  console.error("❌ Scripts directory not found!");
  return [];
 }

 try {
  const scripts: Script[] = [];
  const entries = await readdir(scriptsDir, { withFileTypes: true });

  // Process entries
  for (const entry of entries) {
   const fullPath = path.join(scriptsDir, entry.name);

   if (entry.isDirectory() && entry.name !== "runner") {
    // Check for _main.ts in directory
    const mainFilePath = path.join(fullPath, "_main.ts");
    if (existsSync(mainFilePath)) {
     scripts.push({
      name: entry.name, // Use directory name as script name
      path: mainFilePath,
     });
    }
   } else if (
    entry.isFile() &&
    (entry.name.endsWith(".js") || entry.name.endsWith(".ts")) &&
    !entry.name.startsWith("_")
   ) {
    // Add files from root directory
    scripts.push({
     name: path.basename(entry.name, path.extname(entry.name)),
     path: fullPath,
    });
   }
  }

  return scripts;
 } catch (error) {
  console.error("❌ Error reading scripts directory:", error);
  return [];
 }
};

export const listScripts = (scripts: RunnerScript[]): void => {
 if (scripts.length === 0) {
  console.info("\n📝 No scripts found in the scripts directory.\n");
  return;
 }

 console.info("\n📝 Available scripts:\n");
 scripts.forEach(({ name }) => {
  return console.info(`  • ${name}`);
 });
 console.info("\n▶️  Run a script using: bun run-script <script-name>\n");
};
