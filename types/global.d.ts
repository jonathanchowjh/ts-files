/* eslint-disable no-unused-vars */

declare namespace TSReset {
  // @ts-expect-error
  type NonFalsy<T> = T extends false | 0 | "" | null | undefined | 0n
    ? never
    : T;

  // @ts-expect-error
  type WidenLiteral<T> = T extends string
    ? string
    : T extends number
    ? number
    : T extends boolean
    ? boolean
    : T extends bigint
    ? bigint
    : T extends symbol
    ? symbol
    : T;
}

interface ReadonlyArray<T> {
  includes(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number
  ): boolean;
  lastIndexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number
  ): number;
  indexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number
  ): number;
  filter(predicate: BooleanConstructor, thisArg?: any): TSReset.NonFalsy<T>[];
}

interface Array<T> {
  includes(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number
  ): boolean;
  lastIndexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number
  ): number;
  indexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number
  ): number;
  filter(predicate: BooleanConstructor, thisArg?: any): TSReset.NonFalsy<T>[];
}

interface Map<K, V> {
  has(value: K | (TSReset.WidenLiteral<K> & {})): boolean;
}

interface ReadonlyMap<K, V> {
  has(value: K | (TSReset.WidenLiteral<K> & {})): boolean;
}

interface Set<T> {
  has(value: T | (TSReset.WidenLiteral<T> & {})): boolean;
}

interface ReadonlySet<T> {
  has(value: T | (TSReset.WidenLiteral<T> & {})): boolean;
}

interface ArrayConstructor {
  isArray(arg: any): arg is unknown[];
}

interface Body {
  json(): Promise<unknown>;
}

interface JSON {
  parse(
    text: string,
    reviver?: (this: any, key: string, value: any) => any
  ): unknown;
}
