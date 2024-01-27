import { FileStaticMethods } from "../utils/fsStatic"
import path from "path";

const fsStatic = FileStaticMethods;

describe('fs static', () => {
  beforeAll(async () => {
    await resetDir();
  });

  test('static function: walk', async () => {
    const directory = await fsStatic.walk(__dirname);
    const directoryWithFolders = await fsStatic.walk(__dirname, true);
    // FIND fsStatic.test.ts file
    expect(
      directory.filter(
        (item) => !Array.isArray(item) && item.endsWith("fsStatic.test.ts")
      ).length
    ).toBe(1);
    // FIND testDir files
    expect(
      directory
        .filter((item) => Array.isArray(item))
        .filter((dir) => (dir as Array<any>).filter(
          (item) => !Array.isArray(item) && (
              item.endsWith("testFile.csv") ||
              item.endsWith("testFile.json") ||
              item.endsWith("testFile.txt")
            )
        ).length === 3)
        .length
    ).toBe(1);
    // FIND testDir folder
    expect(
      directoryWithFolders.filter(
        (item) => (
          Array.isArray(item) &&
          item.filter(
            (folders) => !Array.isArray(folders) && folders.endsWith("testDir")
          ).length !== 0
        )
      ).length
    ).toBe(1);
  });

  test('static function: flatten', async () => {
    const sampleDir = ['fsStatic.test.ts', ['testFile.csv','testFile.json','testFile.txt']];
    const sampleFiles = ['fsStatic.test.ts', 'testFile.csv','testFile.json','testFile.txt'];
    const files = fsStatic.flatten(sampleDir);
    // TEST 2D array flattened
    expect(sampleFiles.map((file) => files.includes(file)).reduce((prev, curr) => prev && curr, true)).toBe(true);
    // TEST 2D array
    expect(sampleFiles.map((file) => sampleDir.includes(file)).reduce((prev, curr) => prev && curr, true)).toBe(false);
  });

  test('static function: pathFind', async () => {
    const file = await fsStatic.pathFind(__dirname, 'testFile.csv');
    const folder = await fsStatic.pathFind(__dirname, 'testDir', true);
    const invalidFile = await fsStatic.pathFind(__dirname, 'testFile.exe');
    // FILE FOUND
    expect(file.endsWith("testDir/testFile.csv")).toBe(true);
    // FOLDER FOUND
    expect(folder.endsWith("testDir")).toBe(true);
    // FILE NOT FOUND
    expect(invalidFile.endsWith("testDir/testFile.exe")).toBe(false);
  });

  test('static function: pathIterate', async () => {
    const shouldBeNull = await fsStatic.pathIterate(
      __dirname,
      true,
      async (p, c) => {
        if (c === "testDir") return true;
        return null;
      }
    );
    const shouldBeTrue = await fsStatic.pathIterate(
      path.join(__dirname, "testDir"),
      true,
      async (p, c) => {
        if (c === "testDir") return true;
        return null;
      }
    );
    // DIRECTORY doesn't include testDir
    expect(shouldBeNull).toBeNull();
    // DIRECTORY includes testDir
    expect(shouldBeTrue).toBe(true);
  });

  test('static function: pathCreate', async () => {
    const dirPath = path.join(__dirname, "testDir");
    await fsStatic.pathCreate(
      path.join(dirPath, "toRemove.txt"),
      true
    );
    await fsStatic.pathCreate(
      path.join(dirPath, "toRemove"),
      false
    );
    // FILE CREATED
    expect(await fsStatic.pathFind(__dirname, "toRemove.txt")).not.toBe("");
    // FOLDER CREATED
    expect(await fsStatic.pathFind(__dirname, "toRemove", true)).not.toBe("");
    await resetDir();
  });

  test('static function: pathDelete', async () => {
    await fsStatic.pathDelete([
      path.join(__dirname, "testDir", "testFile.txt"),
      path.join(__dirname, "testDir", "testFolder")
    ], true);
    // FILE DELETED
    expect(await fsStatic.pathFind(__dirname, "testFile.txt")).toBe("");
    // FOLDER DELETED
    expect(await fsStatic.pathFind(__dirname, "testFolder", true)).toBe("");
    await resetDir();
  });

  test('static function: createIfNotExist', async () => {
    const dirPath = path.join(__dirname, "testDir");
    await fsStatic.createIfNotExist(
      path.join(dirPath, "toRemove.txt")
    );
    // FILE CREATED
    expect(await fsStatic.pathFind(__dirname, "toRemove.txt")).not.toBe("");
    await resetDir();
  });

  test('static function: rootFromPath', async () => {
    const root = await fsStatic.rootFromPath();
    // Points to root folder, ts-files, location of package.json
    expect(root.endsWith("ts-files")).toBe(true);
  });

  test('static function: rootDefault', async () => {
    const root = await fsStatic.rootDefault();
    // Points to root folder, ts-files, location of package.json or node_modules
    expect(root.endsWith("ts-files")).toBe(true);
  });

  test('static function: root', async () => {
    const root = await fsStatic.root("tests/testDir");
    // Gives Absolute Path, given relative path from rootFolder
    expect(root.endsWith("ts-files/tests/testDir")).toBe(true);
  });

  test('static function: isValidPath', async () => {
    const isValidPath = await fsStatic.isValidPath(__dirname);
    const isValidFolder = await fsStatic.isValidPath(path.join(__dirname, "testDir", "testFolder"));
    const isNotValidPath = await fsStatic.isValidPath(path.join(__dirname, "sample.txt"));
    expect(isValidPath).toBe(true);
    expect(isValidFolder).toBe(true);
    expect(isNotValidPath).toBe(false);
  });

  test('static function: isValid', async () => {
    const invalid = await fsStatic.isValid(path.join(__dirname, "sample.txt"));
    const file = await fsStatic.isValid(path.join(__dirname, "testDir", "testFile.txt"));
    const directory = await fsStatic.isValid(path.join(__dirname, "testDir"));
    expect(invalid).toBe("INVALID");
    expect(file).toBe("FILE");
    expect(directory).toBe("DIRECTORY");
  });

  test('static function: read', async () => {
    const fileName = path.join(__dirname, "testDir", "testFile.txt");
    const words = await fsStatic.read(fileName);
    expect(words).toBe("testName,testIdx,testItem\njon,1,2\nsam,2,1\nsab,3,12");
  });

  test('static function: write', async () => {
    const fileName = path.join(__dirname, "testDir", "testFile.txt");
    await fsStatic.write(fileName, "abc");
    const words = await fsStatic.read(fileName);
    expect(words).toBe("abc");
    await resetDir();
  });

  test('static function: readStream', async () => {
    const fileName = path.join(__dirname, "testDir", "testFile.txt");
    const words = await fsStatic.readStream(fileName);
    expect(words).toBe("testName,testIdx,testItem\njon,1,2\nsam,2,1\nsab,3,12");
  });

  test('static function: writeStream', async () => {
    const fileName = path.join(__dirname, "testDir", "testFile.txt");
    await fsStatic.writeStream(fileName, "abc");
    const words = await fsStatic.read(fileName);
    expect(words).toBe("abc");
    await resetDir();
  });
});

export const wait = (timeInMs: number) => new Promise((resolve) => {
  setTimeout(resolve, timeInMs)
})

export const resetDir = async () => {
  await fsStatic.pathDelete([
    path.join(__dirname, "testDir")
  ], true);
  await fsStatic.pathCreate(path.join(__dirname, "testDir"), false);
  await fsStatic.pathCreate(path.join(__dirname, "testDir", "testFolder"), false);
  await fsStatic.createIfNotExist(path.join(__dirname, "testDir", "testFolder", "sample.txt"));
  await fsStatic.createIfNotExist(path.join(__dirname, "testDir", "testFile.txt"));
  await fsStatic.createIfNotExist(path.join(__dirname, "testDir", "testFile.json"));
  await fsStatic.createIfNotExist(path.join(__dirname, "testDir", "testFile.csv"));
  const csvString = "testName,testIdx,testItem\njon,1,2\nsam,2,1\nsab,3,12";
  const jsonString = JSON.stringify({
    tests:[{testName:"jon",testIdx:1,testItem:2},{testName:"sam",testIdx:2,testItem:1},{testName:"sab",testIdx:3,testItem:12}]
  });
  await fsStatic.write(path.join(__dirname, "testDir", "testFile.txt"), csvString);
  await fsStatic.write(path.join(__dirname, "testDir", "testFile.csv"), csvString);
  await fsStatic.write(path.join(__dirname, "testDir", "testFile.json"), jsonString);
  await wait(100);
}
