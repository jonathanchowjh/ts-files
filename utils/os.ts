import { exec } from "child_process";
import { catchError, UtilsError } from "./error";

// Usage: await execute("echo me") => { stdout: "me", stderr: "" }
export const execute = (
  command: string
): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve({ stdout, stderr });
    });
  });

// Usage: await catchExecute("echo me") => { stdout: "me", stderr: "" }
export const catchExecute = async (
  command: string,
  verbose?: boolean
): Promise<ReturnType<typeof execute> | null> => {
  const val = await catchError<ReturnType<typeof execute>>(
    () => execute(command),
    verbose
  );
  return val;
};

// Usage: await safeExecute("echo me") => "me"
export const safeExecute = async (
  command: string,
  verbose?: boolean
): Promise<string> => {
  const val = await catchExecute(command, verbose);
  if (val == null && typeof val == "object") {
    throw new UtilsError(`ERROR CAUGHT => Execute => ${command}`);
  }
  if (val.stderr !== "") {
    throw new UtilsError(val.stderr);
  }
  return val.stdout;
};

export type Machine = "Linux" | "Mac" | "Cygwin" | "MinGw";

export type MachineFunctions = {
  // eslint-disable-next-line no-unused-vars
  [key in Machine]?: string;
};

// Usage: await uname() => "Mac"
export const uname = async (): Promise<Machine> => {
  const machine = await safeExecute("uname -s");
  const mach = machine.trim();
  if (mach === "Linux") return "Linux";
  if (mach === "Darwin") return "Mac";
  if (mach === "CYGWIN") return "Cygwin";
  if (mach === "MINGW") return "MinGw";
  throw new UtilsError("Invalid Machine Type");
};

// Usage: await (unameExecute({ Mac: "ls" }))()
export const unameExecute =
  (functions: MachineFunctions, verbose?: boolean) => async () => {
    const machine = await uname();
    if (functions[machine] === undefined) {
      throw new UtilsError(`Invalid Machine: ${machine} wasnt instantiated`);
    }
    const machineCmd = functions[machine] as string;
    return catchExecute(machineCmd, verbose);
  };

/**
 * uname -s
 * Linux*)     machine=Linux;;
 * Darwin*)    machine=Mac;;
 * CYGWIN*)    machine=Cygwin;;
 * MINGW*)     machine=MinGw;;
 * *)          machine="UNKNOWN:${unameOut}"
 * https://www.hostinger.com/tutorials/cron-job
 */

export const cron = () => {};
