/* eslint-disable */
import { CsvFile, FileStaticMethods } from "ts-files"

const main = async () => {
  const file = await CsvFile.init('sample.csv');
  await file.readCsv(1);  // reading csv in chunks, with 1 header line
  file.header();          // header (as Array<string>)
  file.data();            // data (as Array<Array<string | number | boolean>>)
  file.head(3);           // console.table of first 3 lines
  file.shape();           // shape (eg. [20, 3] is 20 lines with 3 columns)
  
  const fileWriter = await CsvFile.initCreate('writing.csv');
  fileWriter.setHeader(['testName', 'testIdx', 'testItem']);
  fileWriter.setData([['john', 1, 2], ['abram', 2, 1]]);
  await fileWriter.writeCsv();
};

main().then(() => {});
