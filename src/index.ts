import { CsvFile } from '../utils/csvFile';
import { JsonFile } from '../utils/jsonFile';
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

  // // WRITE
  // const header = ['testName', 'testIdx', 'testItem'];
  // const data = [['john', 1, 2], ['abram', 2, 1], ['connie', 3, 12]];
  // const fileWrite = await CsvFile.initCreate('src/csvFile.csv');
  // fileWrite.setHeader(header);
  // fileWrite.setData(data);
  // fileWrite.appendLine(data[0]);
  // await fileWrite.writeCsv(3);
  // await fileWrite.appendCsv(); // RESETS data
  // await fileWrite.appendCsvLine(['append', 2, 1]);

  const json = '{"tests":[{"testName":"jon","testIdx":1,"testItem":2},{"testName":"sam","testIdx":2,"testItem":1},{"testName":"sab","testIdx":3,"testItem":12}]}';
  const jsonFile = await JsonFile.initCreate('src/jsonFile.json');
  const cmd2 = [
    jsonFile.setFull(JSON.parse(json)),
    jsonFile.parse(['tests', (a) => a.testIdx === 1]),
    jsonFile.set(['tests', (a) => a.testIdx === 1], 'key', [1, 2, 'key']),
    jsonFile.setArray(['tests', (a) => a.testIdx === 1, 'key'], 0, null, 'key'),
    jsonFile.setArray(['tests', (a) => a.testIdx === 1, 'key'], null, 'key', 'value'),
    jsonFile.push(['tests', (a) => a.testIdx === 1, 'key'], 'value'),
    await jsonFile.writeJson(),

    await jsonFile.readJson(),
    jsonFile.data(),
    jsonFile.head(),
  ];
  cmd2.map((cmd) => console.log(cmd));

  // file.readJson() => Record<Array<number | string>>
  // file.writeJson()
  // file.writeCsv()
  // file.data() => give number of lines requested by user
};

main().then(() => {});
