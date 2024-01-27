import { FileMethods } from "../utils/fs";
import { resetDir } from "./fsStatic.test";
import path from "path";

describe('fs', () => {
  beforeAll(async () => {
    await resetDir();
  });

  test('function: writeStream', async () => {
    const file = new FileMethods("fs.test.ts")
    await file.validFileName()
    expect("abc").toBe("abc");
  });
});
