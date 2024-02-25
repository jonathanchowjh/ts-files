import { FileStaticMethods } from './fsStatic';

export class CsvFile {
  public static static = FileStaticMethods;

  public readonly fileName: string = '';

  public readonly encoding: BufferEncoding;

  private stringData: string = '';

  private csvData: Array<Array<string | number | boolean>> = [];

  private csvHeader: Array<string> = [];

  private csvLastLine: string = '';

  private csvHeaderLines: number = 1;

  private csvLineLength: number = 0;

  constructor(fileName: string, options = { encoding: 'utf8' }) {
    this.fileName = fileName;
    this.encoding = options.encoding as BufferEncoding;
    if (!this.fileName.endsWith('.csv')) {
      throw new Error('invalid file type');
    }
  }

  static async init(fileName: string) {
    const fullLoc = await CsvFile.static.root(fileName);
    if ((await CsvFile.static.isValid(fullLoc)) !== 'FILE') {
      throw new Error('Invalid file location');
    }
    return new CsvFile(fullLoc);
  }

  static async initCreate(fileName: string) {
    const fullLoc = await CsvFile.static.root(fileName);
    await CsvFile.static.createIfNotExist(fullLoc);
    return CsvFile.init(fileName);
  }

  async read(): Promise<string> {
    this.stringData = await CsvFile.static.read(this.fileName);
    return this.stringData;
  }

  async write(data: string): Promise<void> {
    return CsvFile.static.write(this.fileName, data);
  }

  data() {
    return this.csvData;
  }

  header() {
    return this.csvHeader;
  }

  shape() {
    return [this.csvData.length, this.csvLineLength];
  }

  head(length = 3) {
    const ret = [];
    for (let i = 0; i < length; i++) {
      const temp: Record<string, string | number | boolean> = {};
      this.csvData[i].forEach((val, idx) => {
        const index = this.csvHeader[idx];
        if (typeof index === 'string') {
          temp[index as string] = val;
          return;
        }
        temp[idx.toString()] = val;
      });
      ret.push(temp);
    }
    // eslint-disable-next-line
    console.table(ret);
  }

  async readCsv(
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
  ): Promise<Array<Array<string | number | boolean>>> {
    this.csvData = [];
    this.csvLastLine = '';
    this.csvHeaderLines = csvHeaderLines;
    this.csvLineLength = 0;
    await CsvFile.static.readStream(
      this.fileName,
      {
        encoding: options.encoding,
        appendType: 'string', // string / bufferArray
        onData: this.processData(options),
        onEnd: this.processEnd(options),
        onError: (err: Error): void => {},
      }
    );
    return this.csvData;
  }

  setHeader(
    header: Array<string>
  ) {
    if (this.csvHeader.length !== 0) throw new Error('header already initialised');
    // TODO: validate data and set variables
    this.csvHeader = header;
  }

  setData(
    data: Array<Array<string | number | boolean>>
  ) {
    if (this.csvData.length !== 0) throw new Error('data already initialised');
    // TODO: validate data and set variables
    this.csvData = data;
  }

  appendLine(
    line: Array<string | number | boolean>
  ) {
    // TODO: validate data and set variables
    this.csvData.push(line);
  }

  async writeCsv(numberOfChunks = 1, useHeader = true, isAppend = false): Promise<void> {
    const chunkLength = Math.floor(this.csvData.length / numberOfChunks);
    let nextIdx = 0;
    const chunks = [];
    for (let i = 0; i < numberOfChunks; i++) {
      let toIdx = Math.min(nextIdx + chunkLength, this.csvData.length);
      if (i === numberOfChunks - 1) {
        toIdx = this.csvData.length;
      }
      chunks.push(
        CsvFile.csv2String(
          this.csvData.slice(nextIdx, toIdx),
          i !== 0 || !useHeader ? [] : this.csvHeader
        )
      );
      nextIdx += chunkLength;
    }
    await FileStaticMethods.writeStream(
      this.fileName,
      chunks,
      {
        encoding: 'utf8' as BufferEncoding,
        flags: isAppend ? 'a' : 'w',
        appendType: 'string',
        onData: (chunk: string | Buffer): void => {},
        onEnd: (str: string): string => str,
        onError: (err: Error): void => {},
      }
    );
  }

  async appendCsv(numberOfChunks = 1, useHeader = false, preventReset = false): Promise<void> {
    await this.writeCsv(numberOfChunks, useHeader, true);
    if (!preventReset) {
      this.resetState();
    }
  }

  async appendCsvLine(line: Array<string | number | boolean>): Promise<void> {
    this.csvData.push(line);
    await FileStaticMethods.writeStream(
      this.fileName,
      CsvFile.csv2String(
        [line],
        []
      ),
      {
        encoding: 'utf8' as BufferEncoding,
        flags: 'a',
        appendType: 'string',
        onData: (chunk: string | Buffer): void => {},
        onEnd: (str: string): string => str,
        onError: (err: Error): void => {},
      }
    );
  }

  resetState() {
    this.csvData = [];
    this.csvHeader = [];
    this.csvHeaderLines = 1;
    this.csvLastLine = '';
    this.csvLineLength = 0;
    this.stringData = '';
  }

  /**
   * ============================================
   * PRIVATE METHODS
   * ============================================
   */
  private processEnd(options: {
    encoding: BufferEncoding;
    delimiter: string;
    columnOptions: {
      trim: boolean;
      ltrim: boolean;
      rtrim: boolean;
      parseBooleans: boolean;
      parseNumbers: boolean;
    };
  }) {
    return (data: string): string => {
      this.csvData.push(
        CsvFile
          .splitText(this.csvLastLine, this.csvLineLength, options.delimiter)
          .map((column) => CsvFile.formatData(column, options.columnOptions))
      );
      return '';
    };
  }

  private processData(options: {
    encoding: BufferEncoding;
    delimiter: string;
    columnOptions: {
      trim: boolean;
      ltrim: boolean;
      rtrim: boolean;
      parseBooleans: boolean;
      parseNumbers: boolean;
    };
  }): (a: string, b: string | Buffer) => string {
    return (
      (data: string, chunk: string | Buffer): string => {
        // PROCESS CHUNK
        const lines = (this.csvLastLine + chunk.toString()).split('\n'); // this.csvLastLine needs to be cleared
        this.csvLastLine = lines[lines.length - 1];
        const isFirstChunk = this.csvData.length === 0;
        // PROCESS LINE
        for (let i = 0; i < lines.length - 1; i++) {
          const isHeader = isFirstChunk && this.csvHeaderLines > i;
          const columns = CsvFile.splitText(
            lines[i],
            this.csvLineLength,
            options.delimiter,
            isHeader || this.csvLineLength === 0
          );
          if (this.csvLineLength === 0) {
            this.csvLineLength = columns.length;
          }
          if (isHeader && this.csvHeader.length < columns.length) {
            this.csvHeader = columns;
            continue;
          }
          this.csvData.push(
            columns.map((column) => CsvFile.formatData(column, options.columnOptions))
          );
        }
        return ''; // return data + chunk; // (if you want readStream function to perform accumulation)
      }
    );
  }

  /**
   * ============================================
   * PRIVATE STATIC METHODS
   * ============================================
   */

  private static csv2String(
    data: Array<Array<string | number | boolean>>,
    header: Array<string>
  ): string {
    if (header.length === 0 && data.length === 0) return '';
    const lineLength = header.length === 0 ? data[0].length : header.length;
    let ret = header.reduce((prev, curr) => `${prev}${curr},`, '').slice(0, -1);
    ret += header.length === 0 ? '' : '\n';
    for (let i = 0; i < data.length; i++) {
      let line = data[i];
      if (line.length < lineLength) {
        Array.from(Array(lineLength - line.length).keys()).forEach(() => line.push(''));
      } else if (line.length > lineLength) {
        line = line.slice(0, lineLength);
      }
      ret += ((
        line.reduce((prev, curr) => `${prev.toString()}${curr.toString()},`, '')
      ) as string).slice(0, -1);
      ret += '\n';
    }
    return ret;
  }

  // TODO
  private static string2Csv(
    str: string,
    isFirstChunk: boolean
  ): [Array<Array<string | number | boolean>>, Array<string>] {
    return [[], []];
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
