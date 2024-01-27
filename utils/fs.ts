import fs from "fs";
import path from "path";
import { FileStaticMethods } from "./fsStatic";

export class FileMethods {
  public static static = FileStaticMethods;

  public readonly fileName: string = "";

  public readonly type: string = "";

  public readonly encoding: BufferEncoding;

  private data: any = "";

  private lastLine: string = "";

  private headerLines: number = 1;

  private format: string = "";

  private noOfColumns: number = 0;

  constructor(fileName: string, options={encoding: 'utf8'}) {
    this.fileName = fileName;
    this.encoding = options.encoding as BufferEncoding;
    if (this.fileName.endsWith(".json")) {
      this.type = "json";
    } else if (this.fileName.endsWith(".csv")) {
      this.type = "csv";
    } else {
      this.type = "txt"
    }
  }

  static async init(fileName: string) {
    const fullLoc = await FileMethods.static.root(fileName);
    if ((await FileMethods.static.isValid(fullLoc)) !== "FILE") {
      throw new Error("Invalid file location");
    }
    return new FileMethods(fullLoc);
  }

  static async initCreate(fileName: string) {
    const fullLoc = await FileMethods.static.root(fileName);
    await FileMethods.static.createIfNotExist(fullLoc);
    return FileMethods.init(fileName);
  }

  head(length=3) {
    if (Array.isArray(this.data)) {
      return this.data.slice(0, Math.min(length, this.data.length));
    }
    const lengthWords = 3 ? 500 : length;
    return this.data.slice(0, Math.min(lengthWords, this.data.length));
  }

  shape() {
    return [0, 1];
  }

  async read(): Promise<string> {
    this.data = await FileMethods.static.read(this.fileName);
    return this.data;
  }

  async readCsv(
    headerLines=1,
    options={
      encoding: this.encoding,
      delimiter: ",",
      columnOptions: {
        trim: true,
        ltrim: false,
        rtrim: false,
        parseBooleans: true,
        parseNumbers: true
      }
    }
  ): Promise<Array<Array<string | number | boolean>>> {
    this.data = [];
    this.lastLine = "";
    this.headerLines = headerLines;
    this.format = "csv";
    await FileMethods.static.readStream(
      this.fileName,
      {
        encoding: options.encoding,
        appendType: 'string', // string / bufferArray
        onData: this.processChunk(options),
        onEnd: (data: string): string => data,
        onError: (err: Error): void => {},
      }
    );
    return this.data;
  }

  async write(data: string): Promise<void> {
    return FileMethods.static.write(this.fileName, data);
  }

  /**
   * ============================================
   * PRIVATE METHODS
   * ============================================
   */
  private processChunk (options: {
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
        let processHeaderLines = false;
        if (this.data.length === 0) processHeaderLines = true;
        // PROCESS CHUNK
        const lines = (this.lastLine + chunk.toString()).split("\n"); // this.lastLine needs to be cleared
        this.lastLine = lines[lines.length - 1];
        // PROCESS LINE
        for (let i = 0; i < lines.length - 1; i++) {
          const columns = lines[i]
            .split(options.delimiter)
            .map((column) => FileMethods.processData(column, options.columnOptions))
          this.data.push(columns);  // this.data needs to be cleared
        }
        // PROCESS HEADERLINES
        // process headers => all same length, determines length of shape
        // process lines (shape) => if line = 0, first line length is length of shape
        // process lines => less than length, create empty string columns / more than length, last column as string
        if (processHeaderLines) {
          if (!Array.isArray(this.data)) throw new Error("Invalid type");
          if (this.data.length < this.headerLines) throw new Error("Too many header lines");
          if (
            !(
              this.data
                .slice(0, this.headerLines)
                .every(val => val === this.data[0])
            )
          ) {
            throw new Error("")
          }
          
        }
        return data + chunk;
      }
    )
  }

  private static processData = (
    column: string,
    options={
      trim: true,
      ltrim: false,
      rtrim: false,
      parseBooleans: true,
      parseNumbers: true
    }
  ): string | number | boolean => {
    const PARSE_FLOAT_TEST = /^[-+]?\d+(?:\.\d*)?(?:[eE]\+\d+)?$|^(?:\d+)?\.\d+(?:e+\d+)?$|^[-+]?Infinity$|^[-+]?NaN$/;
    if (options.trim) {
      column = column.trim();
    } else if (options.ltrim) {
      column = column.replace(/^\s+/, '');
    } else if (options.rtrim) {
      column = column.replace(/\s+$/, '');
    }
    if (options.parseBooleans) {
      if (column === 'true') return true;
      if (column === 'false') return false;
    }
    if (options.parseNumbers) {
      if (PARSE_FLOAT_TEST.test(column)) {
        return parseFloat(column);
      }
    }
    return column;
  };
}





