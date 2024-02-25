import fs from 'fs';
import path from 'path';
import * as util from 'util';
import * as stream from 'stream';
import { once } from 'events';

export class FileStaticMethods {
  // Usage: await read(await root('constants.json')) => string
  static readStream(
    fullLoc: string,
    options = {
      encoding: 'utf8' as BufferEncoding,
      appendType: 'string', // string / bufferArray
      onData: (data: string, chunk: string | Buffer): string => data + chunk,
      onEnd: (data: string): string => data,
      onError: (err: Error): void => {},
    }
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if ((await FileStaticMethods.isValid(fullLoc)) !== 'FILE') {
        reject('Invalid File Name');
      }
      let data: string = '';
      const readerStream = fs.createReadStream(fullLoc);
      readerStream.setEncoding(options.encoding);
      readerStream.on('data', (chunk) => {
        data = options.onData(data, chunk);
      });
      readerStream.on('end', () => {
        readerStream.close();
        resolve(options.onEnd(data));
      });
      readerStream.on('error', (err) => {
        options.onError(err);
        reject(err.stack);
      });
    });
  }

  // Usage: await read(await root('constants.json')) => string
  static writeStream(
    fullLoc: string,
    data: string | Array<string> | Array<Buffer> | Generator<string>,
    options = {
      encoding: 'utf8' as BufferEncoding,
      flags: 'w',
      appendType: 'string', // string / bufferArray
      onData: (chunk: string | Buffer): void => {},
      onEnd: (str: string): string => str,
      onError: (err: Error): void => {},
    }
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if ((await FileStaticMethods.isValid(fullLoc)) !== 'FILE') {
        reject('Invalid File Name');
      }
      const finished = util.promisify(stream.finished);
      const writable = fs.createWriteStream(
        fullLoc,
        { encoding: options.encoding, flags: options.flags }
      );
      const iterable = typeof data === 'string' ? [data] : data;
      for await (const chunk of iterable) {
        options.onData(chunk);
        if (!writable.write(chunk)) {
          await once(writable, 'drain');
        }
      }
      writable.end();
      await finished(writable);
      writable.close();
      options.onEnd('');
      resolve();
    });
  }

  // Usage: await read(await root('constants.json')) => string
  static async read(fullLoc: string): Promise<string> {
    if ((await FileStaticMethods.isValid(fullLoc)) !== 'FILE') {
      throw new Error('file path doesnt exist');
    }
    return (await fs.promises.readFile(fullLoc)).toString();
  }

  // Usage: await read(await root('constants.json')) => string
  static async write(fullLoc: string, data: string): Promise<void> {
    if ((await FileStaticMethods.isValid(fullLoc)) !== 'FILE') {
      throw new Error('file path doesnt exist');
    }
    fs.promises.writeFile(fullLoc, data);
  }

  /**
   * ======================================
   * Valid Path
   * ======================================
   */

  // await FileMethods.isValidPath('./src/index.ts')
  static async isValid(fileName: string): Promise<enumFileNameType> {
    const isValidPath = await FileStaticMethods.isValidPath(fileName);
    if (!isValidPath) return 'INVALID';
    const stats = await fs.promises.stat(fileName);
    if (stats.isFile()) return 'FILE';
    if (stats.isDirectory()) return 'DIRECTORY';
    if (stats.isSymbolicLink()) return 'LINK';
    return 'INVALID';
  }

  // await FileMethods.isValidPath('./src/index.ts')
  static async isValidPath(pathName: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (fs.existsSync(pathName)) {
        resolve(true);
      }
      resolve(false);
    });
  }

  /**
   * ======================================
   * Root Search
   * ======================================
   */

  // Usage: await root('constants.json') => string
  static async root(loc: string) {
    return path.resolve(await FileStaticMethods.rootDefault(), loc);
  }

  // Usage: await rootDefault() => string
  static async rootDefault(): Promise<string> {
    return __dirname.includes('node_modules')
      ? __dirname.split('node_modules')[0]
      : FileStaticMethods.rootFromPath();
  }

  // Usage: await rootFromPath() => string
  static async rootFromPath(): Promise<string> {
    const iter = await FileStaticMethods.pathIterate<string>(__filename, false, async (p, c) => {
      if (p === '' && c === '') throw new Error('No NodeJS root found');
      const files = await fs.promises.readdir(p);
      if (files.includes('package.json')) return p;
      return null;
    });
    if (iter == null && typeof iter == 'object') {
      throw new Error('Unexpected null returned');
    }
    return iter;
  }

  /**
   * ======================================
   * Create / Search Path
   * ======================================
   */

  // Usage: await createIfNotExist(await root('constants.json'))
  static async createIfNotExist(fullLoc: string): Promise<void> {
    if (!(await FileStaticMethods.isValidPath(fullLoc))) {
      await FileStaticMethods.pathCreate(fullLoc, true);
    }
  }

  static async pathDelete(locs: string[], ignoreErrors: boolean): Promise<void> {
    for (let i = 0; i < locs.length; i++) {
      const isValid = await FileStaticMethods.isValid(locs[i]);
      if (isValid === 'INVALID') {
        if (ignoreErrors) continue;
        throw new Error('invalid-file-name');
      }
      if (isValid === 'LINK') {
        if (ignoreErrors) continue;
        throw new Error('invalid-file-type');
      }
      await fs.promises.rm(locs[i], { recursive: true, force: true });
    }
  }

  // Usage: await pathCreate(await root('constants.json'), true)
  static async pathCreate(loc: string, file: boolean): Promise<void> {
    await FileStaticMethods.pathIterate<void>(loc, true, async (p, c, l) => {
      if (p === '' && c === '') return;
      const files = await fs.promises.readdir(p);
      if (files.includes(c)) return null;
      if (l && file) {
        const tempFile = await fs.promises.open(path.resolve(p, c), 'w');
        tempFile.close();
        return null;
      }
      await fs.promises.mkdir(path.resolve(p, c));
      return null;
    });
  }

  // await pathIterate(await rootDefault(), true, async (p, c) => console.log(p, c));
  static async pathIterate<R>(
    location: string,
    accending: boolean,
    callback: (p: string, c: string, last: boolean) => Promise<R | null>
  ): Promise<R | null> {
    const pathSplit = (l: string): string[] => {
      const arr = l.split('/');
      return arr.filter((val) => val !== '');
    };
    const locSplit = pathSplit(location);
    let start = accending ? 0 : locSplit.length - 1;
    const end = accending ? locSplit.length : 0;
    while (accending ? start < end : start >= end) {
      const prevLoc = `/${locSplit.slice(0, start).join('/')}`;
      const currLoc = locSplit[start];
      const cbRet = await callback(
        prevLoc,
        currLoc,
        accending ? !(start + 1 < end) : !(start + 1 >= end)
      );
      if (cbRet != null) return cbRet;
      accending ? start++ : start--;
    }
    return callback('', '', true);
  }

  // Usage: await pathFind(await rootDefault(), 'constants.json') => string
  static async pathFind(dir: string, file: string, includeFolders = false): Promise<string> {
    const filesInDir = await FileStaticMethods.walk(dir, includeFolders);
    const files = FileStaticMethods.flatten<string>(filesInDir as any[]);
    for (let i = 0; i < files.length; i++) {
      const temp = files[i].split('/');
      if (temp[temp.length - 1] === file) return files[i];
    }
    return '';
  }

  // Usage: await flatten<string>(strArr as any[]) => string[]
  static flatten<T>(arr: T[]) {
    return arr.flat(Infinity);
  }

  // Usage: await walk(await rootDefault()) => string[]
  static async walk(dir: string, includeFolders = false): Promise<Nested<string>> {
    const files = await fs.promises.readdir(dir);
    if (files.length === 0) return [];
    const filesInDepth: Nested<string> = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
          if (includeFolders) {
            return new Promise(async (resolve) => {
              const dirPaths = await FileStaticMethods.walk(filePath, includeFolders);
              resolve([filePath, dirPaths]);
            });
          }
          return FileStaticMethods.walk(filePath, includeFolders);
        }
        if (stats.isFile()) return filePath;
        throw new Error('invalid-file-type');
      })
    );
    return filesInDepth;
  }
}

export type enumFileNameStatus = 'NOT_CHECKED' | 'VALID' | 'INVALID';
export type enumFileNameType = 'INVALID' | 'FILE' | 'DIRECTORY' | 'LINK';
export type Nested<T> = Array<T | Nested<T>>;
