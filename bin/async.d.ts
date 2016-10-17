import { Nullable } from "./option";
/** Useful for defining callback result types if you don't care whether they run asynchronously. */
export declare type Awaitable<T> = Promise<T> | T;
/** Type of node.js-style callback functions. */
export declare type Callback<T> = (err: Nullable<Error>, result: Nullable<T>) => void;
/**
Use a callback-style function, returning a Promise.
For example: `callback(cb => fs.readFile("foo.txt", "utf-8", cb))
*/
export declare function callback<T>(callbackUser: (callback: (error: Nullable<Error>, result: Nullable<T>) => void) => void): Promise<T>;
/**
Quickly wrap a callback-style function into one that returns a promise.
This is best used only in one-off cses.
For commonly used functions, create a documented wrapper functino that uses `callback` internally.
*/
export declare function promisify<T>(f: (callback: Callback<T>) => void): () => Promise<T>;
export declare function promisify<A, T>(f: (a: A, callback: Callback<T>) => void): (a: A) => Promise<T>;
export declare function promisify<A, B, T>(f: (a: A, b: B, callback: Callback<T>) => void): (a: A, b: B) => Promise<T>;
export declare function promisify<A, B, C, T>(f: (a: A, b: B, c: C, callback: Callback<T>) => void): (a: A, b: B, c: C) => Promise<T>;
/** Wrap a value in `Promise.resolve` if necessary. */
export declare function toPromise<T>(value: Awaitable<T>): Promise<T>;
/** Promise that takes a given amount of time to be resolved. */
export declare function sleep(milliseconds: number): Promise<void>;
/** Stores functions for resolving / rejecting a `Promise<T>`. */
export interface Deferred<T> {
    resolve(value: T): void;
    reject(error: Error): void;
}
/**
Create a new Promise and a Deferred for resolving it.
Usually it is more convenient to just call the Promise constructor directly.
*/
export declare function deferred<T>(): [Deferred<T>, Promise<T>];
