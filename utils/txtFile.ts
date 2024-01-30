import { FileStaticMethods } from './fsStatic';

export class TxtFile {
  public static static = FileStaticMethods;

  public readonly fileName: string = '';

  public readonly encoding: BufferEncoding;

  private stringData: string = '';

  constructor(fileName: string, options = { encoding: 'utf8' }) {
    this.fileName = fileName;
    this.encoding = options.encoding as BufferEncoding;
    if (!this.fileName.endsWith('.csv')) {
      throw new Error('invalid file type');
    }
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

  async write(data: string): Promise<void> {
    return TxtFile.static.write(this.fileName, data);
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

  private static formatData(
    column: string,
    options = {
      trim: true,
      ltrim: false,
      rtrim: false,
      parseBooleans: true,
      parseNumbers: true
    }
  ): string | number | boolean {
    const PARSE_FLOAT_TEST = /^[-+]?\d+(?:\.\d*)?(?:[eE]\+\d+)?$|^(?:\d+)?\.\d+(?:e+\d+)?$|^[-+]?Infinity$|^[-+]?NaN$/;
    let col = column;
    if (options.trim) {
      col = col.trim();
    } else if (options.ltrim) {
      col = col.replace(/^\s+/, '');
    } else if (options.rtrim) {
      col = col.replace(/\s+$/, '');
    }
    if (options.parseBooleans) {
      if (col === 'true') return true;
      if (col === 'false') return false;
    }
    if (options.parseNumbers) {
      if (PARSE_FLOAT_TEST.test(col)) {
        return parseFloat(col);
      }
    }
    return col;
  }

  private static splitText(
    text: string,
    segments: number,
    delimiter = ',',
    useDefault = false
  ) {
    if (useDefault) return text.split(delimiter);
    const ret: string[] = [];
    let lastIdx = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === delimiter) {
        ret.push(text.slice(lastIdx, i));
        lastIdx = i + 1;
        if (segments === ret.length + 1) break;
      }
    }
    ret.push(text.slice(lastIdx, text.length));
    return ret;
  }
}
