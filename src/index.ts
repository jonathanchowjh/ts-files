import { FileMethods } from "../utils/fs";
import path from 'path';

const main = async () => {
  const templateCsv = "testName,testIdx,testItem\njon,1,2\nsam,2,1\nsab,3,12";
  // const file = await FileMethods.init("data/sample.csv");
  const file = await FileMethods.init("tests/testDir/testFile.csv");
  await file.readCsv(1);
  const cmds = [
    file.type,
    file.headers(),
    file.data(),
    file.head(),
    file.shape(),
  ]
  cmds.map((cmd) => console.log(cmd))
  // file.readJson() => Record<Array<number | string>>
  // file.writeJson()
  // file.writeCsv()
  // file.data() => give number of lines requested by user
}

main().then(() => {})
