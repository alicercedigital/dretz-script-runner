#!/usr/bin/env node
import { loadScripts, listScripts } from "./load-scripts";
import { runScript } from "./run-script";

export type RunnerScript = {
 name: string;
 path: string;
};

const main = async (): Promise<void> => {
 try {
  const scripts = await loadScripts();
  const scriptName = process.argv[2];

  if (!scriptName || scriptName === "--help" || scriptName === "-h") {
   listScripts(scripts);
   process.exit(0);
  }

  await runScript(scriptName, scripts);
  process.exit(0);
 } catch (error) {
  console.error(error);
  process.exit(1);
 }
};

main();
