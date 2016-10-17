import { Predicate } from "./function";
/** Used to indicate an expression to be filled in later. */
export declare function TODO(reason?: string): never;
/** Curried form of `===`. Useful to pass into `filter`-like functions. */
export declare function eq<T>(value: T): Predicate<T>;
/** Function that ignores all arguments. */
export declare function ignore(): void;
/** Useful for throwing an Error in expression position. */
export declare function raise(error?: Error): never;
