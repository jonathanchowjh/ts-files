import { FileStaticMethods } from './fsStatic';

/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */

export class JsonFile {
  public static static = FileStaticMethods;

  public readonly fileName: string = '';

  public readonly encoding: BufferEncoding;

  private stringData: string = '';

  private jsonData: { [x: string]: JSONValue } | Array<JSONValue> = {};

  constructor(fileName: string, options = { encoding: 'utf8' }) {
    this.fileName = fileName;
    this.encoding = options.encoding as BufferEncoding;
    if (!this.fileName.endsWith('.json')) {
      throw new Error('invalid file type');
    }
  }

  static async init(fileName: string) {
    const fullLoc = await JsonFile.static.root(fileName);
    if ((await JsonFile.static.isValid(fullLoc)) !== 'FILE') {
      throw new Error('Invalid file location');
    }
    return new JsonFile(fullLoc);
  }

  static async initCreate(fileName: string) {
    const fullLoc = await JsonFile.static.root(fileName);
    await JsonFile.static.createIfNotExist(fullLoc);
    return JsonFile.init(fileName);
  }

  async read(): Promise<string> {
    this.stringData = await JsonFile.static.read(this.fileName);
    return this.stringData;
  }

  async write(data: string): Promise<void> {
    return JsonFile.static.write(this.fileName, data);
  }

  setFull(data: { [x: string]: JSONValue } | Array<JSONValue>): JsonFile {
    this.jsonData = data;
    return this;
  }

  parse(
    parsers: Array<string | ((a: any, b: number) => boolean)>,
    setData: ((a: JSONValue) => JSONValue) | null = null,
    data: JSONValue = this.jsonData
  ): JSONValue {
    if (parsers.length === 0) {
      if (setData !== null) {
        data = setData(data);
      }
      return data;
    }
    if (
      typeof data === 'string'
      || typeof data === 'number'
      || typeof data === 'boolean'
    ) {
      throw new Error('cannot parse string | number | boolean');
    }
    if (typeof parsers[0] === 'string') {
      if (typeof data !== 'object' || data === null) {
        throw new Error('key parser not at object');
      }
      if ((data as { [x: string]: JSONValue })[parsers[0]] === undefined) {
        throw new Error('key undefined');
      }
      return this.parse(
        parsers.slice(1),
        setData,
        (data as { [x: string]: JSONValue })[parsers[0]]
      );
    }
    if (typeof parsers[0] === 'function') {
      if (!Array.isArray(data)) {
        throw new Error('function parser not at array');
      }
      const filter = data.filter(parsers[0]);
      if (filter.length === 0) {
        throw new Error('filter undefined');
      }
      return this.parse(
        parsers.slice(1),
        setData,
        filter[0]
      );
    }
    throw new Error('parser has to be string or function');
  }

  set(
    parsers: Array<string | ((a: any, b: number) => boolean)>,
    key: string,
    value: JSONValue,
    force: boolean = false
  ): JsonFile {
    if (force) this.setForce(parsers, 'string');
    this.parse(parsers, JsonFile.setData([key, value], null));
    return this;
  }

  setArray(
    parsers: Array<string | ((a: any, b: number) => boolean)>,
    index: number | null,
    indexOf: string | boolean | number | null,
    value: JSONValue
  ): JsonFile {
    this.parse(parsers, JsonFile.setData(null, [index, indexOf, value]));
    return this;
  }

  push(
    parsers: Array<string | ((a: any, b: number) => boolean)>,
    value: JSONValue
  ): JsonFile {
    this.parse(parsers, JsonFile.setData(null, [null, null, value]));
    return this;
  }

  async writeJson() {
    this.jsonData;
  }

  async readJson() {
    this.jsonData;
  }

  data() {
    return this.jsonData;
  }

  head() {
    this.jsonData;
  }

  /**
   * ============================================
   * PRIVATE METHODS
   * ============================================
   */

  private setForce(
    parsers: Array<string | ((a: any, b: number) => boolean)>,
    lastParser: 'string' | 'function'
  ) {
    for (let i = 0; i < parsers.length; i++) {
      const currParser = typeof parsers[i];
      const nextParser = i + 1 >= parsers.length ? lastParser : typeof parsers[i + 1];
      const value = nextParser === 'string' ? {} : [];
      if (currParser === 'string') {
        this.parse(
          parsers.slice(0, i),
          JsonFile.setData([parsers[i] as string, value], null)
        );
        continue;
      }
      if (currParser === 'function') {
        throw new Error('cannot force set array');
      }
      throw new Error('parser has to be string or function');
    }
  }

  /**
   * ============================================
   * PRIVATE STATIC METHODS
   * ============================================
   */

  private static setData(
    setObject: [k: string, v: JSONValue] | null,
    setArray: [
      i: number | null,
      io: string | number | boolean | null,
      v: JSONValue
    ] | null,
  ): (a: JSONValue) => JSONValue {
    return (b: JSONValue) => {
      const data = b;
      if (setObject !== null) {
        if (typeof data !== 'object' || data === null) {
          throw new Error('setObject: data not object');
        }
        (data as { [x: string]: JSONValue })[setObject[0]] = setObject[1];
        return data;
      }
      if (setArray !== null) {
        if (!Array.isArray(data)) {
          throw new Error('setArray: data not array');
        }
        const [i, io, v] = setArray;
        if (i !== null) {
          if (i < 0 || i >= data.length) {
            throw new Error('setArray: indexOf not in array');
          }
          data[i] = v;
          return data;
        }
        if (io !== null) {
          const dataIdx = data.indexOf(io);
          if (dataIdx === -1) {
            throw new Error('setArray: indexOf not in array');
          }
          data[dataIdx] = v;
          return data;
        }
        data.push(v);
        return data;
      }
      return '';
    };
  }

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

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;
