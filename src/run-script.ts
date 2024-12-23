import type { RunnerScript } from ".";
import { listScripts } from "./load-scripts";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";

const setupSignalHandlers = (cleanup: () => Promise<void>) => {
 const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGQUIT"];

 signals.forEach((signal) => {
  process.on(signal, async () => {
   console.info(`\nReceived ${signal}. Cleaning up...`);
   await cleanup();
   // Give some time for cleanup before exiting
   setTimeout(() => {
    return process.exit(1);
   }, 100);
  });
 });
};

type RunningProcess = {
 process: ChildProcess;
 controller: AbortController;
};

export const runScript = async (
 scriptName: string,
 scripts: RunnerScript[],
): Promise<void> => {
 let currentProcess: RunningProcess | null = null;
 const script = scripts.find((s) => {
  return s.name === scriptName;
 });

 if (!script) {
  console.error(`❌ Script '${scriptName}' not found!`);
  listScripts(scripts);
  return;
 }

 console.info(`🚀 Running script: ${scriptName}`);

 const controller = new AbortController();

 try {
  const args = process.argv.slice(3);
  const child = spawn("bun", [script.path, ...args], {
   stdio: "inherit",
   shell: true,
   signal: controller.signal,
  });

  currentProcess = { process: child, controller };

  const cleanup = async () => {
   if (currentProcess) {
    currentProcess.controller.abort();
    currentProcess.process.kill("SIGTERM");
   }
  };

  setupSignalHandlers(cleanup);

  return new Promise((resolve, reject) => {
   child.on("error", (error) => {
    if (error.name === "AbortError") {
     console.info("Script execution was aborted");
     resolve();
    } else {
     console.error(`❌ Error running script: ${error.message}`);
     reject(error);
    }
   });

   child.on("exit", (code) => {
    currentProcess = null;
    if (code === 0) {
     console.info(`✅ Script "${scriptName}" completed successfully`);
     resolve();
    } else if (code === null) {
     console.info("Script execution was terminated");
     resolve();
    } else {
     console.error(`❌ Script ${scriptName} failed with code ${code}`);
     reject("");
    }
   });
  });
 } catch (error) {
  console.error(`❌ Failed to run script ${scriptName}:`);
  console.error(error);
 }
};
