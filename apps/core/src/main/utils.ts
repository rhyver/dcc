import { ResultAsync, Result, ok, err } from 'neverthrow'
import { promises as fs } from 'fs'
import superjson from 'superjson'
import type { $ZodIssue, $ZodError, output, ParseContext } from 'zod/v4/core'
import { type ZodType, custom, safeParse } from 'zod/v4'

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError)
    }
  }
}

export function readFile(path: string) {
  return ResultAsync.fromPromise(fs.readFile(path, 'utf-8'), (error) => {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        return new NotFoundError(`File not found: ${path}`)
      }
      return error
    }
    return new Error('Unknown error reading file')
  })
}

export function writeFile(path: string, data: object) {
  return ResultAsync.fromPromise(
    fs.writeFile(path, superjson.stringify(data), 'utf-8'),
    (error) => {
      if (error instanceof Error) {
        return error
      }
      return new Error('Unknown error writing file')
    }
  )
}

export function ensureDirectory(path: string) {
  return ResultAsync.fromPromise(
    fs.mkdir(path, { recursive: true }),
    (error) => {
      if (error instanceof Error) {
        return error
      }
      return new Error('Unknown error creating directory')
    }
  )
}

export function readDirectory(path: string) {
  return ResultAsync.fromPromise(fs.readdir(path), (error) => {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        return new NotFoundError(`Directory not found: ${path}`)
      }
      return error
    }
    return new Error('Unknown error reading directory')
  })
}

export function parseJson(value: string) {
  const p = Result.fromThrowable(superjson.parse, (error) => {
    if (error instanceof Error) {
      return error
    }
    return new Error('Unknown error parsing JSON')
  })

  return p(value)
}

export function neverthrowParse<T extends ZodType>(
  schema: T,
  data: unknown,
  params?: ParseContext<$ZodIssue>
): Result<output<T>, $ZodError<output<T>> | Error> {
  try {
    const { success, data: parsed, error } = safeParse(schema, data, params)

    return success ? ok(parsed) : err(error)
  } catch (error) {
    if (error instanceof Error) {
      return err(error)
    }
    return err(new Error('Unknown error parsing schema'))
  }
}

export function isResult<T = unknown, E = unknown>(value: unknown): value is Result<T, E> {
  return (
    value != null &&
    typeof value === 'object' &&
    Reflect.has(value, 'isOk') &&
    Reflect.has(value, 'isErr')
  )
}

export function createResultSchema<T extends ZodType, E extends ZodType>(value: T, error: E) {
  return custom<Result<output<T>, output<E>>>(
    (v) =>
      isResult(v) &&
      (v.isOk() ? value.safeParse(v.value).success : error.safeParse(v.error).success)
  )
}
