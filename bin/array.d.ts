import { Comparer, Predicate } from "./function";
import { Nat } from "./math";
import { Option } from "./option";
import { Seq } from "./seq";
/**
Empty immutable array.
Using this instead of a literal array `[]` to avoid allocating memory.
*/
export declare const empty: never[];
/**
Replace each element with the result of calling `getNewValue`.
If `getNewValue` throws, the inputs will be left in a bad state.
(To mutate each element in place, just use a for-of loop.)
*/
export declare function mapMutate<T>(inputs: T[], getNewValue: (element: T, index: number) => T): void;
/**
Delete elements of an array not satisfying `predicate`.
If `predicate` throws, the array will be left in a bad state.
*/
export declare function filterMutate<T>(inputs: T[], predicate: Predicate<T>): void;
/**
Replace elements with the result of [[tryGetOutput]] or delete them if that returns `undefined`.
If [[tryGetOutput] throws, the array will be left in a bad state.
*/
export declare function mapDefinedMutate<T>(inputs: T[], tryGetOutput: (input: T) => Option<T>): void;
/** Change the value at a single index in an array by applying a function to it. */
export declare function mutate<T>(inputs: T[], index: Nat, transform: (t: T) => T): void;
/**
Remove an element from an array and do not preserve the array's order.
Useful for arrays used to represent small sets.
Returns whether the value was successfully removed.
*/
export declare function removeUnordered<T>(inputs: T[], value: T, equal?: Comparer<T>): boolean;
/**
Mutate [[inputs]] by combining them with each in [[other]].
If [[other]] is shorter than [[inputs]], this will reduce [[inputs]] in length.
If [[other]] is longer, the extra entries are ignored.
*/
export declare function zipMutate<T, U>(inputs: T[], other: Iterable<U>, zipper: (input: T, other: U) => T): void;
/** Provides async utilities for an array. */
export declare function asyncArray<T>(inputs: T[]): AsyncArrayOps<T>;
/**
Wrapper class for utilities that mutate arrays asynchronously.
For non-mutating utilities use [[AsyncSeq]].
*/
export declare class AsyncArrayOps<T> {
    private inputs;
    constructor(inputs: T[]);
    /** Asynchronous [[mapMutate]]. */
    map(getNewValue: (element: T, index: number) => Promise<T>): Promise<void>;
    /** Asynchronous [[filterMutate]]. */
    filter(predicate: (element: T) => Promise<boolean>): Promise<void>;
    /** Asynchronous [[mapDefinedMutate]]. Performs `tryGetOutput` one element at a time. */
    mapDefined(tryGetOutput: (input: T) => Promise<Option<T>>): Promise<void>;
    /** Asynchronous [[mutate]]. */
    mutate(index: Nat, transform: (t: T) => Promise<T>): Promise<void>;
}
/** Provides parallel utilities for an array. */
export declare function parallelArray<T>(inputs: T[], maxNumberOfThreads?: number): ParallelArrayOps<T>;
/**
Wrapper class for utilities that mutate arrays in parallel.
For non-mutating utilities use [[ParallelSeq]].
*/
export declare class ParallelArrayOps<T> {
    readonly inputs: T[];
    readonly maxNumberOfThreads: number;
    /** Use [[parallelArray]] rather than calling this directly. */
    constructor(inputs: T[], maxNumberOfThreads?: number);
    /** Parallel [[mapMutate]]. */
    map(mapper: (element: T, index: number) => Promise<T>): Promise<void>;
    /** Parallel [[filterMutate]]. */
    filter(predicate: (element: T, index: number) => Promise<boolean>): Promise<void>;
    /** Parallel [[mapDefinedMutate]]. */
    mapDefined(tryGetOutput: (input: T, index: number) => Promise<Option<T>>): Promise<void>;
}
/**
Whether a number is an integer between 0 and array.length.
Does *not* check for whether there is a "hole" at the index.
*/
export declare function isValidIndex(inputs: {}[], index: Nat): boolean;
/** Throws an error if [[index]] is not a valid index. */
export declare function checkIndex(inputs: {}[], index: Nat): void;
/** Swap two values in an array. */
export declare function swap(inputs: {}[], firstIndex: Nat, secondIndex: Nat): void;
/** Initialize a new array by calling [[makeElement]] [[length]] times. */
export declare function initArray<T>(length: number, makeElement: (index: number) => T): T[];
/** Asynchronous [[initArray]]. */
export declare function initArrayAsync<T>(length: number, makeElement: (index: number) => Promise<T>): Promise<T[]>;
/** Parallel [[initArray]]. */
export declare function initArrayParallel<T>(numberOfThreads: number, length: number, makeElement: (index: number) => Promise<T>): Promise<T[]>;
/**
[[Seq]] iterating over an array in reverse.
O(1) to create.
*/
export declare function reverse<T>(array: T[]): Seq<T>;
/** Immutable `Array.prototype.shift`. */
export declare function shift<T>(array: T[]): Option<[T, T[]]>;
/**
Every item but the first.
Identity for empty arrays.
*/
export declare function tail<T>(array: T[]): T[];
/** True iff an array has 0 length. */
export declare function isEmpty(array: any[]): boolean;
/**
Every item but the last.
Identity for empty arrays.
*/
export declare function rightTail<T>(array: T[]): T[];
/** Immutable `Array.prototype.pop`. */
export declare function pop<T>(array: T[]): Option<[T[], T]>;
/** Last element in the array. */
export declare function last<T>(array: T[]): Option<T>;
