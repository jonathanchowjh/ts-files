/* eslint-disable max-classes-per-file */
/* eslint-disable eqeqeq */
/* eslint-disable arrow-body-style */

// Usage: throw new UtilsError('err msg')
export class UtilsError extends Error {
  constructor(error: string, errorSource?: string) {
    const name = `${errorSource ?? 'ts-methods'}::${stackTrace()[1]}::${error}`;
    super(name);
    Object.setPrototypeOf(this, UtilsError.prototype);
  }
}

// Usage: throw new DefaultError('err msg')
export class DefaultError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, DefaultError.prototype);
  }
}

// Usage: stackTrace() => string[]
export const stackTrace = (
  noFilter?: boolean,
  noDataParsing?: boolean,
  noFilterTrace?: boolean
): string[] => {
  const obj = { stack: '' };
  Error.captureStackTrace(obj, stackTrace);
  if (noFilter) return obj.stack.split('\n');
  return obj.stack
    .split('\n')
    .splice(1)
    .map((val: string) => {
      // remove parenthesis and formatted spacing
      if (noDataParsing) return val;
      return val.replace('    at ', '').replace(/\s*\(.*?\)\s*/g, '');
    })
    .filter((val: string) => {
      // filter stacktrace using keys
      if (noFilterTrace) return true;
      if (val === '' || val == undefined || val == null) return false;
      const words = ['Module.', 'Object.', 'Function.', 'file://'];
      return !new RegExp(words.join('|')).test(val);
    });
};

// Usage: await catchError<ReturnType<func1>>(() => func1(a, b))
export const catchError = async <R>(
  callback: () => R,
  verbose?: boolean
): Promise<R | null> => {
  try {
    return callback();
  } catch (error: unknown) {
    if (!isError(error)) {
      throw new UtilsError('Invalid Error Thrown');
    }
    // eslint-disable-next-line no-console
    console.log(`ERROR CAUGHT => ${error.message}`);
    if (verbose) {
      if (error.stack) {
        // eslint-disable-next-line no-console
        console.log(error.stack);
      }
    }
    // RETURNS null when error is caught
    return null;
  }
};

// ==== NULL & UNDEFINED ====

// Usage: coerceNotNullish(null) => throws
export const coerceNotNullish = <T>(val: T): NonNullable<T> => {
  if (isNullish(val)) throw new UtilsError('value is null | undefined');
  return val as NonNullable<T>;
};

// Usage: isNullish(null) => true
export const isNullish = (val: any): boolean => {
  if (isNull(val)) return true;
  if (val == undefined) return true;
  return false;
};

// Usage: coerceNotNull(null) => throws
export type NonNull<T> = T extends null ? never : T;
export const coerceNotNull = <T>(val: T): NonNull<T> => {
  if (isNull(val)) throw new UtilsError('value is null');
  return val as NonNull<T>;
};

// Usage: isNull(null) => true
export const isNull = (val: any): boolean => val == null && typeof val == 'object';

// Usage: coerceArray<object, any>([]) => []
export const coerceArray = <T, U>(val: U): Array<T> => {
  if (!isArray(val)) throw new UtilsError('value is not Array');
  return val as Array<T>;
};

// Usage: isArray([]) => true
export const isArray = (val: any): boolean => {
  return Array.isArray(val);
};

// Usage: coerceError(err) => Error
export const coerceError = (maybeError: unknown): Error => {
  if (isError(maybeError)) return maybeError;
  try {
    return new UtilsError(JSON.stringify(maybeError));
  } catch {
    return new UtilsError(String(maybeError));
  }
};

// Usage: isError(err) => error is Error
export const isError = (error: unknown): error is Error => typeof error === 'object'
  && error !== null
  && 'message' in error
  && typeof (error as Record<string, unknown>).message === 'string';
