import { catchExecute, execute } from "./os";
import {
  CONSTANTS,
  writeJson,
  writeJson2D,
  readJson2D,
  root,
  pathCreate,
  pathExists,
} from "./fs";
import { readLine, readLineSelect } from "./repl";
import { UtilsError } from "./error";

/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */
/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */

export const STORAGE = "storage";
export const LINK_KEY = "links";

export class GithubREPL {
  constructor() {
    this.run();
  }

  async run() {
    let exit = false;
    while (!exit) {
      const options = [
        "add_link",
        "delete_link",
        "read_link",
        "clone_all",
        "update_all",
        "update_one",
        "exit",
      ];
      console.log(
        "\n\n=====================\nSelect Operation\n=====================\n"
      );
      const option = await readLineSelect("Select Operation: ", options);
      switch (option) {
        case "exit":
          exit = true;
          break;
        case "add_link":
          console.log(await gitRepoUrlAdd());
          break;
        case "delete_link": {
          const ret1 = await gitRepoUrlDelete();
          console.log(
            `\n${Object.keys(ret1)
              .map((key, idx) => `${idx}. ${key}`)
              .join("\n")}`
          );
          break;
        }
        case "read_link": {
          const ret2 = await gitRepoUrlRead();
          console.log(
            `${Object.keys(ret2)
              .map((key, idx) => `${idx}. ${key}`)
              .join("\n")}`
          );
          break;
        }
        case "clone_all": {
          console.log("Cloning Repos...");
          const ret3 = (await cloneAll()).join("\n");
          console.log(ret3);
          console.log("Updating Repos Branches...");
          const ret4 = (await branchUpdateAll()).join("\n");
          console.log(ret4);
          break;
        }
        case "update_all": {
          console.log("Updating Repos Branches...");
          const ret5 = (await branchUpdateAll()).join("\n");
          console.log(ret5);
          break;
        }
        case "update_one": {
          console.log("Updating Single Repos Branches...");
          const ret6 = await branchUpdateOne();
          console.log(ret6);
          // const ret7 = await branchLsRemote("marketplace-api")
          // console.log(ret7);
          break;
        }
        default:
          break;
      }
    }
  }
}

export const gitRepoUrlAdd = async () => {
  // get github link (check if valid)
  const answer = await readLine("Enter Github Link: ");
  if (!gitRepoUrlValid(answer)) throw new UtilsError("Invalid github link");
  // Create file if not exist
  const FILE = await root(CONSTANTS);
  if (!(await pathExists(FILE))) {
    await pathCreate(FILE, true);
    await writeJson(FILE, {});
  }
  // write to file
  await writeJson2D(
    FILE,
    LINK_KEY,
    answer.replace("git@github.com:", "").replace(".git", ""),
    answer
  );
  return answer;
};

export const gitRepoUrlRead = async () => {
  const FILE = await root(CONSTANTS);
  const links: { [k: string]: string } = (await readJson2D(FILE, LINK_KEY)) as {
    [k: string]: string;
  };
  return links;
};

export const gitRepoUrlDelete = async () => {
  const links: { [k: string]: string } = await gitRepoUrlRead();
  const keys = Object.keys(links);
  const selected = await readLineSelect("Enter index of Deleted Entry: ", keys);
  const FILE = await root(CONSTANTS);
  await writeJson2D(FILE, LINK_KEY, selected, "\\DELETE");
  delete links[selected];
  return links;
};

export const gitRepoUrlValid = (str: string): boolean => {
  /* eslint-disable no-useless-escape */
  const regex =
    /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
  /* eslint-enable no-useless-escape */
  return regex.test(str);
};

export const cloneAll = async (): Promise<string[]> => {
  // Get all repo links
  const links: { [k: string]: string } = await gitRepoUrlRead();
  // Create storage root folder
  const FOLDER = await root(STORAGE);
  if (!(await pathExists(FOLDER))) {
    await pathCreate(FOLDER, false);
  }
  // Clone all repos
  const promises: Promise<string>[] = Object.entries(links).map(
    (link: string[]) =>
      new Promise(async (resolve, reject) => {
        const clonedPathStr = `${STORAGE}/${link[0].split("/").pop()}`;
        if (await pathExists(await root(clonedPathStr))) {
          // IF REPO CLONED
          resolve(`File Exists: ${clonedPathStr}`);
        } else {
          // IF REPO NOT CLONED
          const log = await catchExecute(
            `cd ${FOLDER} && git clone ${link[1]}`
          );
          if (log == null && typeof log == "object")
            throw new UtilsError("git clone throws error");
          resolve(`File Cloned: ${log.stdout}, ${log.stderr}`);
        }
        reject(new UtilsError("Unresolved clone_all"));
      })
  );
  // Promise.all - Clone all repos
  return Promise.all(promises);
};

export const branchUpdateAll = async (): Promise<string[]> => {
  // Get all repo links
  const links: { [k: string]: string } = await gitRepoUrlRead();
  // Clone all repos
  const promises: Promise<string>[] = Object.entries(links).map(
    (link: string[]) =>
      new Promise(async (resolve, reject) => {
        const clonedFileStr = `${link[0].split("/").pop()}`;
        const clonedPathStr = `${STORAGE}/${clonedFileStr}`;
        if (await pathExists(await root(clonedPathStr))) {
          // IF REPO CLONED
          const val: { [k: string]: { [j: string]: { [l: string]: string } } } =
            await branchUpdate(clonedFileStr);
          const resolveStr = `Updated Repo: ${clonedFileStr} => ${Object.keys(
            val
          ).join(" | ")}`;
          resolve(resolveStr);
        } else {
          // IF REPO NOT CLONED
          resolve(`Skip Update (Uncloned): ${clonedFileStr}`);
        }
        reject(new UtilsError("Unresolved branch_update_all"));
      })
  );
  // Promise.all - Update all repos
  return Promise.all(promises);
};

export const branchUpdateOne = async (): Promise<string> => {
  // Get all repo links
  const links: { [k: string]: string } = await gitRepoUrlRead();
  const keys = Object.keys(links);
  const selected = await readLineSelect(
    "\nEnter index of repo to be updated: ",
    keys
  );

  // Clone all repos
  return new Promise<string>(async (resolve, reject) => {
    const clonedFileStr = `${selected.split("/").pop()}`;
    const clonedPathStr = `${STORAGE}/${clonedFileStr}`;
    if (await pathExists(await root(clonedPathStr))) {
      // IF REPO CLONED
      const val: { [k: string]: { [j: string]: { [l: string]: string } } } =
        await branchUpdate(clonedFileStr, true);
      const resolveStr = `Updated Repo: ${clonedFileStr} => ${Object.keys(
        val
      ).join(" | ")}`;
      resolve(resolveStr);
    } else {
      // IF REPO NOT CLONED
      resolve(`Skip Update (Uncloned): ${clonedFileStr}`);
    }
    reject(new UtilsError("Unresolved branch_update_all"));
  });
};

export const branchUpdate = async (
  file: string,
  verbose?: boolean
): Promise<{ [k: string]: { [j: string]: { [l: string]: string } } }> => {
  const clonedPathStr = `${STORAGE}/${file}`;
  const clonedPath = await root(clonedPathStr);
  const branches: string[] = await branchLsRemote(file);
  let localBranches: string[] = await branchLsLocal(file);
  const ret: { [k: string]: { [k: string]: { [k: string]: string } } } = {};
  for (let i = 0; i < branches.length; i++) {
    const retMap: { [k: string]: { [k: string]: string } } = {};
    if (!localBranches.includes(branches[i])) {
      // checkout track
      try {
        retMap.checkout_track = await execute(
          `cd ${clonedPath} && git checkout --track origin/${branches[i]}`
        );
        localBranches = await branchLsLocal(file);
      } catch (err: unknown) {
        if (
          !(err instanceof Error) ||
          !err.message.includes("is not a commit and a branch")
        ) {
          throw new UtilsError("Unknown error due to checkout track");
        }
        console.warn(
          `Unable to run: cd ${clonedPath} && git checkout --track origin/${branches[i]}`
        );
        continue;
      }
    }
    // pull update
    retMap.checkout_branch = await execute(
      `cd ${clonedPath} && git checkout ${branches[i]}`
    );
    retMap.pull_origin = await execute(
      `cd ${clonedPath} && git pull origin ${branches[i]}`
    );
    ret[branches[i]] = retMap;
    if (verbose) {
      console.log(
        `Branch Updated: ${clonedPath.split("/").pop()}::${branches[i]}`
      );
    }
  }
  return ret;
};

export const branchLsLocalActive = async (file: string): Promise<string> => {
  const clonedPathStr = `${STORAGE}/${file}`;
  const clonedPath = await root(clonedPathStr);
  const log = await execute(`cd ${clonedPath} && git branch`);
  const ret = log.stdout
    .split("\n")
    .filter((branch) => branch.length >= 2 && branch.slice(0, 2) === "* ")
    .map((branch) => branch.replace("* ", ""));
  if (ret.length !== 1)
    throw new UtilsError(`Invalid branch string ${ret.toString()}`);
  return ret[0];
};

export const branchLsLocal = async (file: string): Promise<string[]> => {
  const clonedPathStr = `${STORAGE}/${file}`;
  const clonedPath = await root(clonedPathStr);
  const log = await execute(`cd ${clonedPath} && git branch`);
  const ret = log.stdout
    .split("\n")
    .map((branch) => branch.replace("* ", "").trim())
    .filter((branch) => branch !== undefined && branch !== "");
  return ret;
};

export const branchLsRemote = async (file: string): Promise<string[]> => {
  const clonedPathStr = `${STORAGE}/${file}`;
  const clonedPath = await root(clonedPathStr);
  const val = await execute(`cd ${clonedPath} && git ls-remote`);
  const ret = val.stdout
    .split("\n")
    .map((branch) => branch.split("\t"))
    .filter((branch) => branch.length === 2)
    .filter((branch) => branch[1].split("/")[1] === "heads")
    .map((branch) => branch[1].split("/").pop())
    .filter((branch) => branch !== undefined && branch.toLowerCase() !== "head")
    .filter((v, i, a) => a.indexOf(v) === i) as string[];
  return ret;
};
