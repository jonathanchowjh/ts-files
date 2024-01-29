import { CsvFile } from '../utils/csvFile';
import { FileStaticMethods } from '../utils/fsStatic';

/* eslint-disable no-console */

const main = async () => {
  const templateCsv = 'testName,testIdx,testItem\njon,1,2\nsam,2,1\nsab,3,12';
  // // READ
  // // const file = await CsvFile.init('data/sample.csv');
  // const file = await CsvFile.init('tests/testDir/testFile.csv');
  // await file.readCsv(1);
  // const cmds = [
  //   file.header(),
  //   file.data(),
  //   file.head(),
  //   file.shape(),
  // ];
  // cmds.map((cmd) => console.log(cmd));

  // WRITE
  const header = ['testName', 'testIdx', 'testItem'];
  const data = [['john', 1, 2], ['abram', 2, 1], ['connie', 3, 12]];
  const fileWrite = await CsvFile.initCreate('tests/testDir/new.csv');
  fileWrite.setHeader(header);
  fileWrite.setData(data);
  fileWrite.appendLine(data[0]);
  await fileWrite.writeCsv(3);
  await fileWrite.appendCsv(); // RESETS data
  await fileWrite.appendCsvLine(['append', 2, 1]);

  // file.readJson() => Record<Array<number | string>>
  // file.writeJson()
  // file.writeCsv()
  // file.data() => give number of lines requested by user
};

main().then(() => {});
