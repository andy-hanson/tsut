import { Comparer, Predicate } from "./function";
/** Value which may be `undefined`. */
export declare type Option<T> = T | undefined;
/**
 * Value which may be `null` or `undefined`.
 * Pass these into `nullable` to make them usable.
*/
export declare type Nullable<T> = T | null | undefined;
/** Convert a value which may be `null` to one which may be `undefined`. */
export declare function optionify<T>(nullable: Nullable<T>): Option<T>;
/** True for any value but `undefined`. */
export declare function exists<T>(option: Option<T>): option is T;
/**
Create an optional value if some condition is true.
Never write `else return undefined` again!
*/
export declare function optional<T>(condition: boolean, result: () => T): Option<T>;
/** Return the value iff the predicate is satisfied. */
export declare function keepIf<T>(value: T, predicate: Predicate<T>): Option<T>;
/** Get the value of an option or throw an error. */
export declare function orThrow<T>(option: Option<T>, error?: () => Error): T;
/**
Use an option iff it exists.
This is like the safe-navigation ("one-eyed elvis") operator: `iff(foo, f => f.bar)` is `foo?.bar`.
*/
export declare function iff<T, U>(option: Option<T>, map: (value: T) => Option<U>): Option<U>;
/**
Try another method of getting an option if it doesn't already exist.
This is like the elvis operator: `or(foo, bar)` is `foo ?: bar`.
*/
export declare function or<T>(option: Option<T>, getDefault: () => T): T;
export declare function or<T>(option: Option<T>, getDefault: () => Option<T>): Option<T>;
/** Combine two options only if they both exist. */
export declare function and<T, U, V>(a: Option<T>, b: Option<U>, combine: (t: T, u: U) => Option<V>): Option<V>;
/**
True iff `a === b` or `equal(a, b)`.
Does not call `equal` if either input is undefined.
*/
export declare function equalOptions<T>(a: Option<T>, b: Option<T>, equal: Comparer<T>): boolean;
