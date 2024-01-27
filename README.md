# ts-files
A File reader and writer, for large multi-chunk operations. Works with CSV, JSON, and raw text.

The File operations uses both the fs and stream libraries, with increased customisability and helpful defaults to help prevent string size restrictions, ulimit errors, synchronous write limitations, etc. In addition, many helpful features include JSON structure searches, type parsing, and column based edits.
### ⚙️ Installation
```sh
npm i ts-files
```
### 🚀 Quickstart
```ts
import { CsvFile, FileStaticMethods } from 'ts-files'

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
```
