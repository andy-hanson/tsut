import { Nullable } from "./option"

/** Useful for defining callback result types if you don't care whether they run asynchronously. */
export type Awaitable<T> = Promise<T> | T

/** Type of node.js-style callback functions. */
export type Callback<T> = (err: Nullable<Error>, result: Nullable<T>) => void

/**
Use a callback-style function, returning a Promise.
For example: `callback(cb => fs.readFile("foo.txt", "utf-8", cb))
*/
export function callback<T>(callbackUser: (callback: (error: Nullable<Error>, result: Nullable<T>) => void) => void): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		callbackUser((error, result) => {
			if (error !== null && error !== undefined)
				reject(error)
			else
				resolve(result!)
		})
	})
}

/**
Quickly wrap a callback-style function into one that returns a promise.
This is best used only in one-off cses.
For commonly used functions, create a documented wrapper functino that uses `callback` internally.
*/
export function promisify<T>(f: (callback: Callback<T>) => void): () => Promise<T>
export function promisify<A, T>(f: (a: A, callback: Callback<T>) => void): (a: A) => Promise<T>
export function promisify<A, B, T>(f: (a: A, b: B, callback: Callback<T>) => void): (a: A, b: B) => Promise<T>
export function promisify<A, B, C, T>(f: (a: A, b: B, c: C, callback: Callback<T>) => void): (a: A, b: B, c: C) => Promise<T>
export function promisify<T>(f: (...args: any[]) => void): (...args: any[]) => Promise<T> {
	return (...args) => new Promise<T>((resolve, reject) => {
		f(...args, (error: Nullable<Error>, result: Nullable<T>) => {
			if (error !== null && error !== undefined)
				reject(error)
			else
				resolve(result!)
		})
	})
}

/** Wrap a value in `Promise.resolve` if necessary. */
export function toPromise<T>(value: Awaitable<T>): Promise<T> {
	return value instanceof Promise ? value : Promise.resolve(value)
}

declare function setTimeout(action: () => void, ms: number): void;

/** Promise that takes a given amount of time to be resolved. */
export function sleep(milliseconds: number): Promise<void> {
	return new Promise<void>(resolve =>
		setTimeout(resolve, milliseconds))
}

/** Stores functions for resolving / rejecting a `Promise<T>`. */
export interface Deferred<T> {
	resolve(value: T): void
	reject(error: Error): void
}

/**
Create a new Promise and a Deferred for resolving it.
Usually it is more convenient to just call the Promise constructor directly.
*/
export function deferred<T>(): [Deferred<T>, Promise<T>] {
	// Prophecy has been fulfilled. https://github.com/Microsoft/TypeScript/issues/11463#issuecomment-252469934
	let resolve: ((value: T) => void) | undefined
	let reject: ((error: Error) => void) | undefined
	const promise = new Promise<T>((_resolve, _reject) => {
		resolve = _resolve
		reject = _reject
	})
	return [{ resolve: resolve!, reject: reject! }, promise]
}
