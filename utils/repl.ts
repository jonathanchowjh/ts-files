import readline from "readline";
import { UtilsError } from "./error";

// Usage: const sex = await readLineSelect("Enter Sex: ", ["Male", "Female"])
export const readLineSelect = async (
  question: string,
  select: string[]
): Promise<string> => {
  const options = select.map((option, idx) => `${idx}. ${option}`);
  // eslint-disable-next-line
  console.log(question);
  // eslint-disable-next-line
  console.log(options.join("\n"));
  const input = await readLine("Input Selection No.: ");
  const idx = parseInt(input, 10);
  if (Number.isNaN(idx)) {
    if (!select.includes(input)) throw new UtilsError("Invalid User Input");
    return input;
  }
  if (idx >= select.length || idx < 0)
    throw new UtilsError("Invalid User Input");
  return select[idx];
};

// Usage: const sex = await readLine("Enter Sex (Male / Female): ")
export const readLine = async (question: string): Promise<string> => {
  let answer: string = "";
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  answer = (await new Promise((resolve) => {
    rl.question(question, resolve);
  })) as string;
  rl.close();
  return answer;
};

/**
 * Usage:
 * class Chat extends REPL {
 *    constructor() {
 *      super("Enter Text: ", true)
 *    }
 *
 *    override default (cmds: string[]): void {
 *        console.log(cmds)
 *    }
 *
 *    edit (cmds: string[]): void {
 *        if (cmds.length < 3) return;
 *        const second = cmds[1]
 *        const third = cmds[2]
 *        if (second != "question") return;
 *        this.question = third
 *    }
 * }
 * new Chat()
 * */
export class REPL {
  question: string = "> ";

  noError: boolean = false;

  constructor(question: string = "", noError: boolean = false) {
    if (question != "") this.question = question;
    this.noError = noError;
    this.run();
  }

  async run() {
    let rl = "";
    while (rl != "exit") {
      rl = await readLine(this.question);
      const cmds = rl.split(" ").filter((val) => val !== "");
      this.default(cmds);

      // reject invalid commands
      if (cmds.length < 1) {
        // eslint-disable-next-line
        continue;
      }
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
      if (!methods.includes(cmds[0])) {
        if (!this.noError) {
          // eslint-disable-next-line
          console.log(`Invalid command: ${cmds[0]}`);
        }
        // eslint-disable-next-line
        continue;
      }

      // call commands
      Object.getPrototypeOf(this)[cmds[0]](cmds);
    }
  }

  // eslint-disable-next-line
  default(cmds: string[]): void {
    // eslint-disable-next-line
    return;
  }
}
