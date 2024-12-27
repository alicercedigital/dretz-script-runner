#!/usr/bin/env node
import { loadScripts, listScripts } from "./load-scripts";
import { runScript } from "./run-script";
import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";
import { Command } from "commander";
import path from "path";

export type RunnerScript = {
 name: string;
 path: string;
};

const program = new Command();

// Setup commander configuration
program
 .name("script-runner")
 .description("Interactive script runner with custom path support")
 .version("1.0.0")
 .option("-p, --path <path>", "Custom scripts directory path")
 .option("-l, --list", "List all available scripts")
 .option("-s, --script <name>", "Run a specific script directly")
 .option("-v, --verbose", "Show detailed script execution information");

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
  // Parse command line arguments correctly
  program.parse(process.argv);
  const options = program.opts();

  // Get all potential script directories
  const scriptDirs = getScriptDirectories(options.path);
  let scripts: RunnerScript[] = [];

  // Try loading scripts from each directory until we find some
  for (const dir of scriptDirs) {
   if (options.verbose) {
    console.log(chalk.gray(`Searching for scripts in: ${dir}`));
   }

   const loadedScripts = await loadScripts(dir);
   if (loadedScripts.length > 0) {
    scripts = loadedScripts;
    if (options.verbose) {
     console.log(
      chalk.green(`✓ Found ${loadedScripts.length} scripts in ${dir}`),
     );
    }
    break;
   }
  }

  // Handle different modes of operation
  if (options.list) {
   listScripts(scripts);
   return;
  }

  if (options.script) {
   if (options.verbose) {
    console.log(chalk.blue(`Running script: ${options.script}`));
   }
   await runScript(options.script, scripts);
   return;
  }

  // Interactive mode
  showWelcomeMessage();
  const selectedScript = await selectScript(scripts);

  if (options.verbose) {
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
