#!/usr/bin/env bun
import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";
import parseArgs from "yargs-parser";
import path from "path";
import { loadScripts, listScripts } from "@/load-scripts";
import { runScript } from "@/run-script";

export type RunnerScript = {
 name: string;
 path: string;
};

// Parse command line arguments
const argv = parseArgs(process.argv.slice(2), {
 alias: {
  p: "path",
  l: "list",
  s: "script",
  v: "verbose",
  h: "help",
  V: "version",
 },
 boolean: ["list", "verbose", "help"],
 string: ["path", "script"],
});

// Show help if requested
if (argv.help) {
 console.log(
  boxen(
   `${chalk.bold.blue("Script Runner")}\n\n` +
    `Options:\n` +
    `  -p, --path <path>    Custom scripts directory path\n` +
    `  -l, --list          List all available scripts\n` +
    `  -s, --script <name>  Run a specific script directly\n` +
    `  -v, --verbose       Show detailed script execution information\n` +
    `  -h, --help          Show this help message\n` +
    `  -V, --version       Show version number`,
   {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "blue",
   },
  ),
 );
 process.exit(0);
}

// Show version if requested
if (argv.version) {
 console.log("1.0.0");
 process.exit(0);
}

const showWelcomeMessage = () => {
 console.log(
  boxen(
   `${
    chalk.bold.blue("🚀 Script Runner\n") + chalk.dim("Select a script to run")
   }\n\n${chalk.italic.gray("Tip: Use --help to see all available options")}`,
   {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "blue",
    title: "Welcome",
    titleAlignment: "center",
   },
  ),
 );
};

const selectScript = async (scripts: RunnerScript[]): Promise<string> => {
 if (scripts.length === 0) {
  throw new Error("No scripts found in the specified directories");
 }

 const { selectedScript } = await inquirer.prompt([
  {
   type: "list",
   name: "selectedScript",
   message: "Choose a script to run:",
   choices: scripts.map((script) => {
    return {
     name: `${chalk.green(script.name)} ${chalk.dim(`(${script.path})`)}`,
     value: script.name,
     short: script.name,
     description: `Path: ${script.path}`,
    };
   }),
   pageSize: 10,
   loop: false,
  },
 ]);

 return selectedScript;
};

const getScriptDirectories = (customPath?: string): string[] => {
 const defaultPaths = ["./scripts", "./src/scripts"];

 if (customPath) {
  const resolvedPath = path.resolve(process.cwd(), customPath);
  return [resolvedPath, ...defaultPaths];
 }

 return defaultPaths;
};

const main = async (): Promise<void> => {
 try {
  // Get all potential script directories
  const scriptDirs = getScriptDirectories(argv.path);
  let scripts: RunnerScript[] = [];

  // Try loading scripts from each directory until we find some
  for (const dir of scriptDirs) {
   if (argv.verbose) {
    console.log(chalk.gray(`Searching for scripts in: ${dir}`));
   }

   const loadedScripts = await loadScripts(dir);
   if (loadedScripts.length > 0) {
    scripts = loadedScripts;
    if (argv.verbose) {
     console.log(
      chalk.green(`✓ Found ${loadedScripts.length} scripts in ${dir}`),
     );
    }
    break;
   }
  }

  // Handle different modes of operation
  if (argv.list) {
   listScripts(scripts);
   return;
  }

  if (argv.script) {
   if (argv.verbose) {
    console.log(chalk.blue(`Running script: ${argv.script}`));
   }
   await runScript(argv.script, scripts);
   return;
  }

  // Interactive mode
  showWelcomeMessage();
  const selectedScript = await selectScript(scripts);

  if (argv.verbose) {
   console.log(chalk.blue(`Running selected script: ${selectedScript}`));
  }

  await runScript(selectedScript, scripts);
 } catch (error) {
  console.error(
   boxen(
    `${chalk.red("Error occurred:")}\n${chalk.white(
     (error as Error)?.message || String(error).slice(0, 100),
    )}`,
    {
     padding: 1,
     borderColor: "red",
     borderStyle: "round",
    },
   ),
  );
  process.exit(1);
 }
};

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
 console.error(chalk.red("Unhandled promise rejection:"), error);
 process.exit(1);
});

main();
