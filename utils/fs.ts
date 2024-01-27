import fs from "fs";
import path from "path";
import { FileStaticMethods } from "./fsStatic";

export class FileMethods {
  public static static = FileStaticMethods;

  public readonly fileName: string = "";

  public readonly type: string = "";

  public readonly encoding: BufferEncoding;

  private format: "csv" | "json" | "string" | "unassigned" = "unassigned";

  private stringData: string = "";

  private csvData: Array<Array<string | number | boolean>> = [];

  private csvHeader: any[] = [];

  private csvLastLine: string = "";

  private csvHeaderLines: number = 1;

  private csvLineLength: number = 0;

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
  
  data() {
    return this.csvData;
  }

  header() {
    return this.csvHeader;
  }

  shape() {
    return [this.csvData.length, this.csvLineLength];
  }

  head(length=3) {
    const ret = [];
    for (let i = 0; i < length; i++) {
      const temp: Record<string, string | number | boolean> = {}
      this.csvData[i].forEach((val, idx) => {
        const index = this.csvHeader[idx];
        if (typeof index === "string") {
          temp[index as string] = val;
          return;
        }
        temp[idx.toString()] = val;
      })
      ret.push(temp)
    }
    console.table(ret);
  }

  async read(): Promise<string> {
    this.stringData = await FileMethods.static.read(this.fileName);
    return this.stringData;
  }

  async readCsv(
    csvHeaderLines=1,
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
    this.csvData = [];
    this.csvLastLine = "";
    this.csvHeaderLines = csvHeaderLines;
    this.format = "csv";
    this.csvLineLength = 0;
    await FileMethods.static.readStream(
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

  async write(data: string): Promise<void> {
    return FileMethods.static.write(this.fileName, data);
  }

  /**
   * ============================================
   * PRIVATE METHODS
   * ============================================
   */
  private processEnd (options: {
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
        FileMethods
          .splitText(this.csvLastLine, this.csvLineLength, options.delimiter)
          .map((column) => FileMethods.formatData(column, options.columnOptions))
      )
      return ""
    }
  }

  private processData (options: {
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
        const lines = (this.csvLastLine + chunk.toString()).split("\n"); // this.csvLastLine needs to be cleared
        this.csvLastLine = lines[lines.length - 1];
        const isFirstChunk = this.csvData.length === 0;
        // PROCESS LINE
        for (let i = 0; i < lines.length - 1; i++) {
          const isHeader = isFirstChunk && this.csvHeaderLines > i;
          const columns = FileMethods.splitText(
            lines[i],
            this.csvLineLength,
            options.delimiter,
            isHeader || this.csvLineLength === 0
          )
          if (this.csvLineLength === 0) {
            this.csvLineLength = columns.length;
          }
          if (isHeader && this.csvHeader.length < columns.length) {
            this.csvHeader = columns;
            continue;
          }
          this.csvData.push(
            columns.map((column) => FileMethods.formatData(column, options.columnOptions))
          );
        }
        return "";  // return data + chunk; // (if you want readStream function to perform accumulation)
      }
    )
  }

  private static formatData = (
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

  private static splitText(
    text: string, segments: number, delimiter=",", useDefault=false
  ) {
    if (useDefault) return text.split(delimiter);
    const ret: string[] = []
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





