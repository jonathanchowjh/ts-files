import { TxtFile } from '../utils/txtFile';

export const runTxt = async () => {
  const file = await TxtFile.initCreate('src/sample.txt');
  await file
    .set('samplessss')
    .writeStream(3);
  await file.readStream();
};
