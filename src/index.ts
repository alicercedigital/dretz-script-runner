#!/usr/bin/env node
import { loadScripts, listScripts } from "./load-scripts";
import { runScript } from "./run-script";
import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";

export type RunnerScript = {
 name: string;
 path: string;
};

const showWelcomeMessage = () => {
 console.log(
  boxen(
   chalk.bold.blue("🚀 Script Runner\n") + chalk.dim("Select a script to run"),
   {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "blue",
   },
  ),
 );
};

const selectScript = async (scripts: RunnerScript[]): Promise<string> => {
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
    };
   }),
   pageSize: 10,
   loop: false,
  },
 ]);

 return selectedScript;
};

const main = async (): Promise<void> => {
 try {
  const scripts = await loadScripts();
  const scriptName = process.argv[2];

  if (scriptName === "--help" || scriptName === "-h") {
   listScripts(scripts);
   process.exit(0);
  }

  if (!scriptName) {
   showWelcomeMessage();
   const selectedScript = await selectScript(scripts);
   await runScript(selectedScript, scripts);
  } else {
   await runScript(scriptName, scripts);
  }

  process.exit(0);
 } catch (error) {
  console.error(chalk.red("Error:"), error);
  process.exit(1);
 }
};

main();
