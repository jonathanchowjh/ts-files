import { FileMethods } from "../utils/fs";
import path from 'path';



const main = async () => {
  const templateCsv = "testName,testIdx,testItem\njon,1,2\nsam,2,1\nsab,3,12";
  const file = await FileMethods.init("data/sample.csv");
  await file.readCsv(0);
  const cmds = [
    file.type,
    file.head(),
    file.shape(),
  ]
  cmds.map((cmd) => console.log(cmd))
  // file.type() => csv / json / txt
  // file.read() => string
  // file.readCsv() => Array<Array<number | string>>
  // file.readJson() => Record<Array<number | string>>
  // file.head()
  // file.readJson()
  // file.readJson()
  // file.readJson()
}

main().then(() => {})
