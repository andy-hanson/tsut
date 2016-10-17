import { AsyncSeq } from "./asyncSeq";
import { Builder } from "./builder";
import { Comparer, Predicate } from "./function";
import { Nat } from "./math";
import { Option } from "./option";
import { ParallelSeq } from "./parallel";
/** IteratorResult for when there are no values left in the sequence. */
export declare const iterDone: IteratorResult<never>;
/** IteratorResult to yield a single value and continue. */
export declare function iterContinue<T>(value: T): IteratorResult<T>;
/**
Wraps an Iterable (or any `() => Iterator<T>`) to provide chainable utilities.
It's not recommended to store a Seq in memory -- use [[toArray]] first.
Also, since elements are computed on demand, use [[eager]] or [[memoize]]
rather than using the same Seq twice.
*/
export declare class Seq<T> implements Iterable<T> {
    /** Seq with no elements. */
    static empty: Seq<never>;
    /** Wrap an Iterable. */
    static from<T>(iterable: Iterable<T>): Seq<T>;
    /** Seq which yields the given values. */
    static of<T>(...values: T[]): Seq<T>;
    /** Repeats the same value forever. */
    static repeat<T>(value: T): Seq<T>;
    /** Repeats the same sequence forever. */
    static cycle<T>(repeated: Iterable<T>): Seq<T>;
    /** Yields `initial`, then keeps calling `modify` and yielding the result until it returns `undefined`. */
    static unfold<T>(initial: T | undefined, modify: (current: T) => T | undefined): Seq<T>;
    /** Allow to view an Option as a Seq of 0 or 1 values. */
    static ofOption<T>(option: Option<T>): Seq<T>;
    [Symbol.iterator]: () => Iterator<T>;
    /**
    Construct a Seq from any arbitrary function returning an Iterator.

    To support iterating more than once, set up any reused state *within* `getIterator`,
    which is called each time the sequence is iterated over.
    For example: prefer `new Seq(function*() { for (let i = 0; i < 3; i++) yield i })`
    over `let i = 0; new Seq(function*() { ... })`
    */
    constructor(getIterator: () => Iterator<T>);
    /** Async utilities. See AsyncSeq for documentation. */
    readonly async: AsyncSeq<T>;
    /** Parallel utilities. See ParallelSeq for documentation. */
    readonly par: ParallelSeq<T>;
    /**
    Eagerly evaluates all elements.
    Use this is you will perform multiple queries to the same Seq
    and you know the queries will use every element.
    (Else, use [[memoize]].)
    */
    eager(): Seq<T>;
    /**
    Remembers values that have been computed before.
    (Maintains a single iterator and a cache of previous iteration results.)
    Use this if you will perform multiple queries to the same Seq
    and you don't know if they will use every element.
    */
    readonly memoize: Seq<T>;
    /** Write out elements to a Builder and finish the Builder. */
    buildTo<U>(builder: Builder<U, T>): U;
    /** Write out elements to a Builder, but do not finish. */
    doBuild(builder: Builder<any, T>): void;
    /** Array.from(this) */
    toArray(): T[];
    /** Set.from(this) */
    toSet(): Set<T>;
    /** Seq that avoids repeating the same element twice. */
    readonly unique: Seq<T>;
    /**
    `Map.from(this)` if no `combineValues` is provided.
    See [[MapBuilder]] for documentation on `combineValues`.
    To let multiple values share a key, see [[groupByToMap]].
    */
    toMap<K, V>(this: Seq<[K, V]>, combineValues?: (left: V, right: V) => V): Map<K, V>;
    /**
    Generates a [key, value] pair for each element and
    creates a `Map` from a key to all values with that key.
    */
    groupBy<K>(toKey: (value: T) => K): Map<K, T[]>;
    /** Like [[groupBy]] but wraps the result as a [[Seq]]. */
    groupBySeq<K>(toKey: (value: T) => K): Seq<[K, T[]]>;
    /** Adds all elements to a [[StringBuilder]]. */
    buildToString(this: Seq<string>, separator?: string): string;
    /**
    Stringifies by calling `toString()` on each element.
    Prefer [[buildToString]] to get more control over the output.
    */
    toString(): string;
    /** Exists so that `JSON.stringify(seq)` will work as if it were an array. */
    toJSON(): T[];
    /** Eagerly performs an action on every element. */
    each(action: (element: T) => void): void;
    /** Runs `getOutput` to produce values for the output Seq. */
    map<U>(getOutput: (value: T) => U): Seq<U>;
    /**
    Concatenates iterables together, and skips `undefined`.
    Note: as the type indicates, this does not deeply flatten.
    So `Seq.of([1], [[2]]).flatten()` is `Seq.of(1, [2])`.
    */
    flatten<T>(this: Seq<Option<Iterable<T>>>): Seq<T>;
    /** `map(mapper).flatten()` */
    flatMap<U>(mapper: (element: T) => Option<Iterable<U>>): Seq<U>;
    /**
    Adds other iterables onto the end of this.
    Undefined ones will be ignored.
    Equivalent to `seq([this, ...concatWith]).flatten()`.
    */
    concat(...concatWith: Option<Iterable<T>>[]): Seq<T>;
    /**
    `map(tryGetOutput).getDefined()`.

    Prefer this over map+filter combinations:
    Prefer `seq.mapDefined(x => optional(f(x), () => g(x))` over `seq.filter(x => f(x)).map(x => g(x))`,
    and `seq.mapDefined(x => keepIf(f(x), y => g(y))` over `seq.map(x => f(x)).filter(y => g(y))`.
    */
    mapDefined<U>(tryGetOutput: (input: T) => Option<U>): Seq<U>;
    /** Filters out undefined values. */
    getDefined<T>(this: Seq<Option<T>>): Seq<T>;
    /** Seq containing only elements satisfying `keepIf`. */
    filter(keepIf: Predicate<T>): Seq<T>;
    /**
    Start with `startAccumulator`, and keep applying `folder` for each element in the Seq.

    Note: Avoid this pattern:

        s.reduce([], (a, e) => returning(a, () => a.push(e)))

    where the value returned by `folder is always the same value.
    It's more honest to just write this as a `for-of` loop mutating a value.
    Complex bodies are also better replaced by a loop.
    */
    reduce<U>(startAccumulator: U, folder: (accumulator: U, element: T) => U): U;
    /**
    Returns true if `searchFor` is in the Seq somewhere.
    Same as `some(eq(searchFor))` or `some(x => equals(searchFor, x))`.
    */
    contains(searchFor: T, equals?: Comparer<T>): boolean;
    /**
    Return the first element satisfying a predicate.
    Same as `filter(predicate).first`.
    */
    find(predicate: Predicate<T>): Option<T>;
    /** True iff iteration immediately stops. */
    readonly isEmpty: boolean;
    /**
    True iff some element satisfies `predicate`.
    For information about that element use `find`.
    */
    some(predicate: (element: T) => boolean): boolean;
    /** False iff any element does not satisfy `predicate`. */
    every(predicate: (element: T) => boolean): boolean;
    /**
    Seq with a single value prepended to the front.
    Same as `Seq.single(value).concat(this)`.
    */
    unshift(value: T): Seq<T>;
    /** First value or `undefined`. */
    readonly first: Option<T>;
    /** All values but the first. Does nothing for empty sequences. */
    readonly tail: Seq<T>;
    /** True iff the sequences contain the same elements in the same order */
    equals(other: Iterable<T>, elementEqual?: Comparer<T>): boolean;
    /** First N elements of the sequence. */
    take(numberToTake: Nat): Seq<T>;
    /**
    Takes elements so long as `predicate` is true.
    Unlike `filter`, stops as soon as `predicate` is false and does not continue looking.
    */
    takeWhile(predicate: (element: T) => boolean): Seq<T>;
    /** Seq without the first `numberToDrop` elements. */
    drop(numberToDrop: Nat): Seq<T>;
    /** Drops elements so long as `predicate` is true. */
    dropWhile(predicate: (element: T) => boolean): Seq<T>;
    /**
    Combines values in two sequences.
    This is only as long as the shorter sequence.
    */
    zip<U, V>(other: Iterable<U>, zipper: (left: T, right: U) => V): Seq<V>;
    zip<U>(other: Iterable<U>): Seq<[T, U]>;
    /** Seq where each element is paired with its index, starting with 0. */
    readonly withIndex: Seq<[T, Nat]>;
    /** Eagerly evaluates, sorts it, then wraps in a Seq again. */
    sort(this: Seq<number> | Seq<string>): Seq<T>;
    sort(comparer: (left: T, right: T) => number): Seq<T>;
    /** Eagerly evaluates, sorts it, then wraps in a Seq again. */
    reverse(): Seq<T>;
    /** Seq containing the elements in both this and other. */
    union(other: Iterable<T>): Seq<T>;
    /** Eagerly evaluates `other` and returns a Seq of the elements in this that are also in `other`. */
    intersection(other: Iterable<T>): Seq<T>;
    /** Eagerly evaluates `other` and returns a Seq of the elements in this not in `other`. */
    difference(other: Iterable<T>): Seq<T>;
    /**
    Evaluates all elements and returns their count.
    If you want to do other things in addition to counting, consider using `eager` first so the Seq is evaluated only once.
    */
    count(): Nat;
    /**
    Returns the greatest element.
    If `comparer` is provided, it should return a value > 0 if `left` is the new maximum.
    */
    max(this: Seq<number>): Option<T>;
    max(comparer: (left: T, right: T) => number): Option<T>;
    /**
    Returns the least element.
    If `comparer` is provided, it should return a value < 0 if `left` is the new maximum.
    */
    min(this: Seq<number>): Option<T>;
    min(comparer: (left: T, right: T) => number): Option<T>;
    /** Sum of numbers. */
    sum(this: Seq<number>): number;
}
/** Shorthand for [[Seq.from]]. */
export declare const seq: typeof Seq.from;
/** Creates an iterator from a `next` callback. */
export declare function iterator<T>(next: () => IteratorResult<T>): Iterator<T>;
/**
Create a single-use Iterable from an Iterator.
Useful for calling `yield*`.
*/
export declare function iterableOfIterator<T>(iterator: Iterator<T>): Iterable<T>;
