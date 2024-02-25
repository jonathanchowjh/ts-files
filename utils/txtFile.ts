import { FileStaticMethods } from './fsStatic';

export class TxtFile {
  public static static = FileStaticMethods;

  public readonly fileName: string;

  public readonly encoding: BufferEncoding;

  private stringData: string = '';

  constructor(fileName: string, options = { encoding: 'utf8' }) {
    this.fileName = fileName;
    this.encoding = options.encoding as BufferEncoding;
  }

  static async init(fileName: string) {
    const fullLoc = await TxtFile.static.root(fileName);
    if ((await TxtFile.static.isValid(fullLoc)) !== 'FILE') {
      throw new Error('Invalid file location');
    }
    return new TxtFile(fullLoc);
  }

  static async initCreate(fileName: string) {
    const fullLoc = await TxtFile.static.root(fileName);
    await TxtFile.static.createIfNotExist(fullLoc);
    return TxtFile.init(fileName);
  }

  async read(): Promise<string> {
    this.stringData = await TxtFile.static.read(this.fileName);
    return this.stringData;
  }

  async write(): Promise<void> {
    return TxtFile.static.write(this.fileName, this.stringData);
  }

  set(data: string): TxtFile {
    this.stringData = data;
    return this;
  }

  data(): string {
    return this.stringData;
  }

  async readStream(
    csvHeaderLines = 1,
    options = {
      encoding: this.encoding,
      delimiter: ',',
      columnOptions: {
        trim: true,
        ltrim: false,
        rtrim: false,
        parseBooleans: true,
        parseNumbers: true
      }
    }
  ): Promise<string> {
    const str = await FileStaticMethods.readStream(
      this.fileName,
      {
        encoding: options.encoding,
        appendType: 'string', // string / bufferArray
        onData: (data: string, chunk: string | Buffer): string => data + chunk,
        onEnd: (data: string): string => data,
        onError: (err: Error): void => {},
      }
    );
    return str;
  }

  async writeStream(
    numberOfChunks = 1,
    isAppend = false,
    onData = (chunk: string | Buffer): void => {},
    onEnd = (str: string): string => str,
    onError = (err: Error): void => {},
  ): Promise<void> {
    await FileStaticMethods.writeStream(
      this.fileName,
      TxtFile.splitEveryN(this.stringData, Math.ceil(this.stringData.length / numberOfChunks)),
      {
        encoding: 'utf8' as BufferEncoding,
        flags: isAppend ? 'a' : 'w',
        appendType: 'string',
        onData,
        onEnd,
        onError,
      }
    );
  }

  /**
   * ============================================
   * PRIVATE METHODS
   * ============================================
   */

  /**
   * ============================================
   * PRIVATE STATIC METHODS
   * ============================================
   */

  // eslint-disable-next-line
  private static *splitEveryN(str: string, n: number): Generator<string> {
    for (let index = 0; index < str.length; index += n) {
      yield str.slice(index, index + n);
    }
  }
}
