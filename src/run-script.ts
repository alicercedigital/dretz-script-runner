import type { RunnerScript } from "@/index";
import { listScripts } from "@/load-scripts";
import type { Subprocess } from "bun";

const setupSignalHandlers = (cleanup: () => Promise<void>) => {
 const signals: string[] = ["SIGINT", "SIGTERM", "SIGQUIT"];

 signals.forEach((signal) => {
  process.on(signal, async () => {
   console.info(`\nReceived ${signal}. Cleaning up...`);
   await cleanup();
   // Give some time for cleanup before exiting
   setTimeout(() => {
    process.exit(1);
   }, 100);
  });
 });
};

type RunningProcess = {
 process: Subprocess;
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
  const child = Bun.spawn(["bun", script.path, ...args], {
   stdio: ["inherit", "inherit", "inherit"],
   signal: controller.signal,
  });

  currentProcess = { process: child, controller };

  const cleanup = async () => {
   if (currentProcess) {
    currentProcess.controller.abort();
    currentProcess.process.kill();
   }
  };

  setupSignalHandlers(cleanup);

  return new Promise((resolve, reject) => {
   // Wait for process to exit
   child.exited
    .then((status) => {
     currentProcess = null;
     if (status === 0) {
      console.info(`✅ Script "${scriptName}" completed successfully`);
      resolve();
     } else if (status === null) {
      console.info("Script execution was terminated");
      resolve();
     } else {
      console.error(`❌ Script ${scriptName} failed with code ${status}`);
      reject(new Error(`Script exited with code ${status}`));
     }
    })
    .catch((error) => {
     if (error.name === "AbortError") {
      console.info("Script execution was aborted");
      resolve();
     } else {
      console.error(`❌ Error running script: ${error.message}`);
      reject(error);
     }
    });
  });
 } catch (error) {
  console.error(`❌ Failed to run script ${scriptName}:`);
  console.error(error);
  throw error;
 }
};
