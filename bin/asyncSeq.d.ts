import { Awaitable } from "./async";
import { Builder } from "./builder";
import { ComparerAsync, PredicateAsync } from "./function";
import { Nat } from "./math";
import { Option } from "./option";
import { ParallelSeq } from "./parallel";
import { Seq } from "./seq";
/**
Anything that provides the `asyncIterator` method is considered iterable.
Using this instead of a `Symbol.asyncIterator` because that can't currently be typechecked
(https://github.com/Microsoft/TypeScript/issues/5579)
*/
export interface AsyncIterable<T> {
    asyncIterator(): AsyncIterator<T>;
}
/**
Async version of Iterator.
Copied from https://github.com/Microsoft/TypeScript/issues/11326
See also https://github.com/tc39/proposal-async-iteration
*/
export interface AsyncIterator<T> {
    next(value?: any): Promise<IteratorResult<T>>;
    return?(value?: any): Promise<IteratorResult<T>>;
    throw?(e?: any): Promise<IteratorResult<T>>;
}
/**
Type used for functions that may accept any iterable object.
Useful with `getAsyncIterator`.
*/
export declare type AnyIterable<T> = Iterable<T> | AsyncIterable<T>;
/** Gets an [[AsyncIterator]] from any iterable object, converting if it has a synchronous iterator. */
export declare function getAsyncIterator<T>(t: AnyIterable<T>): AsyncIterator<T>;
/**
Interface for a push-stream to write to.
Used by [[AsyncSeq.fromPush]].
*/
export interface Pushable<T> {
    /** Add a new element to the sequence. */
    push(element: T): void;
    /**
     * End the sequence in an error.
     * The user of the stream won't see the error until they have used all queued results.
     * This must be the last function called.
     */
    error(error: Error): void;
    /**
     * End the sequence.
     * Without this, the sequence will hang, waiting for the push that never comes.
     * This must be the last function called.
     */
    finish(): void;
}
/**
Wraps an [[AsyncIterable]] (or any `() => AsyncIterator<T>`) to provide chainable utilities.
There's no way to directly turn an [[AsyncSeq]] back into a [[Seq]],
but you can asynchronously finish with [[eager]], [[toArray]], [[each]], [[reduce]].
*/
export declare class AsyncSeq<T> implements AsyncIterable<T> {
    readonly asyncIterator: () => AsyncIterator<T>;
    /** AsyncSeq with no elements. */
    static empty: AsyncSeq<never>;
    /**
    Wraps any iterator.
    Works for `Iterable<T>`, `AsyncIterable<T>`, or a Promise for either.
    */
    static from<T>(seq: Awaitable<AnyIterable<T>>): AsyncSeq<T>;
    /** AsyncSeq which yields the given values. */
    static of<T>(...values: T[]): AsyncSeq<T>;
    /** Yields `initial`, then keeps calling `modify` and yielding the result until it returns `undefined`. */
    static unfold<T>(initial: T | undefined, modify: (current: T) => Awaitable<T | undefined>): AsyncSeq<T>;
    /**
    Converts a push-stream to an AsyncSeq.

    `pusherUser` will be called when the sequence is iterated over. (Use [[eager]]/[[memoize]] so that this only happens once.)
    Having utilities for event emitters might be preferrable to using this, but that's not implemented yet.

    Internally keeps a queue of values that have been pushed but not yet pulled, or
    keeps a queue of promises that have been pulled but have not yet been pushed to (resolved).
    */
    static fromPush<T>(pusherUser: (pusher: Pushable<T>) => void): AsyncSeq<T>;
    /**
    Construct an AsyncSeq from any arbitrary function returning an [[AsyncIterator]].
    Async version of the [[Seq]] constructor.
    */
    constructor(asyncIterator: () => AsyncIterator<T>);
    /** Wraps this in a [[ParallelSeq]]. */
    readonly par: ParallelSeq<T>;
    /** [[toArray]] wrapped as a [[Seq]]. */
    eager(): Promise<Seq<T>>;
    /** Async [[Seq.memoize]]. */
    readonly memoize: AsyncSeq<T>;
    /** Async [[Seq.buildTo]]. */
    buildTo<U>(builder: Builder<U, T>): Promise<U>;
    /** Async [[Seq.doBuilt]]. */
    doBuild(builder: Builder<any, T>): Promise<void>;
    /** Async [[Seq.toArray]]. */
    toArray(): Promise<T[]>;
    /** Async [[Seq.toSet]]. */
    toSet(): Promise<Set<T>>;
    /** Async [[Seq.unique]]. */
    readonly unique: AsyncSeq<T>;
    /** Async [[Seq.toMap]]. */
    toMap<K, V>(this: AsyncSeq<[K, V]>, combineValues?: (left: V, right: V) => V): Promise<Map<K, V>>;
    /** Async [[Seq.groupBy]]. */
    groupBy<K>(toKey: (element: T) => Awaitable<K>): Promise<Map<K, T[]>>;
    /** Async [[Seq.groupBySeq]]. */
    groupBySeq<K>(toKey: (element: T) => Awaitable<K>): AsyncSeq<[K, T[]]>;
    /** Async [[Seq.buildToString]]. */
    buildToString(this: AsyncSeq<string>, separator?: string): Promise<string>;
    /** Returns "AsyncSeq(...)", since this is a synchronous method. Prefer [[buildToString]]. */
    toString(): string;
    /** Async [[Seq.each]]. */
    each(action: (input: T) => Awaitable<void>): Promise<void>;
    /** Async [[Seq.map]] */
    map<U>(mapper: (input: T) => Awaitable<U>): AsyncSeq<U>;
    /** Async [[flatten]]. */
    flatten<T>(this: AnyIterable<Option<AnyIterable<T>>>): AsyncSeq<T>;
    /** Async [[Seq.flatMap]]. */
    flatMap<U>(mapper: (element: T) => Awaitable<Option<AnyIterable<U>>>): AsyncSeq<U>;
    /** Async [[Seq.concat]]. */
    concat(...concatWith: Array<Option<AnyIterable<T>>>): AsyncSeq<T>;
    /** Async [[Seq.mapDefined]]. */
    mapDefined<U>(tryGetOutput: (input: T) => Awaitable<Option<U>>): AsyncSeq<U>;
    /** Async [[Seq.getDefined]]. */
    getDefined<T>(this: AsyncSeq<Option<T>>): AsyncSeq<T>;
    /** Async [[Seq.filter]]. */
    filter(predicate: PredicateAsync<T>): AsyncSeq<T>;
    /** Async [[Seq.reduce]]. */
    reduce<U>(startAccumulator: U, folder: (accumulator: U, element: T) => Awaitable<U>): Promise<U>;
    /** Async [[Seq.contains]]. */
    contains(searchFor: T, equals?: ComparerAsync<T>): Promise<boolean>;
    /** Async [[Seq.find]]. */
    find(predicate: PredicateAsync<T>): Promise<Option<T>>;
    /** Async [[Seq.isEmpty]]. */
    readonly isEmpty: Promise<boolean>;
    /** Async [[Seq.some]]. */
    some(predicate: PredicateAsync<T>): Promise<boolean>;
    /** Async [[Seq.every]]. */
    every(predicate: PredicateAsync<T>): Promise<boolean>;
    /** Async [[Seq.unshift]]. */
    unshift(value: Awaitable<T>): AsyncSeq<T>;
    /** Async [[Seq.first]]. */
    readonly first: Promise<Option<T>>;
    /** Async [[Seq.tail]]. */
    readonly tail: AsyncSeq<T>;
    /** Async [[Seq.equals]]. */
    equals(other: AnyIterable<T>, elementEqual?: ComparerAsync<T>): Promise<boolean>;
    /** Async [[Seq.take]]. */
    take(numberToTake: Nat): AsyncSeq<T>;
    /** Async [[Seq.takeWhile]]. */
    takeWhile(predicate: PredicateAsync<T>): AsyncSeq<T>;
    /** Async [[Seq.drop]]. */
    drop(numberToDrop: Nat): AsyncSeq<T>;
    /** Async [[Seq.dropWhile]]. */
    dropWhile(predicate: PredicateAsync<T>): AsyncSeq<T>;
    /**
    Async [[Seq.zip]].
    It's parallel: The two input iterators' `next` methods are called at the same time.
    */
    zip<U, V>(other: AnyIterable<U>, zipper: (left: T, right: U) => Awaitable<V>): AsyncSeq<V>;
    zip<U>(other: AnyIterable<U>): AsyncSeq<[T, U]>;
    /** Async [[Seq.withIndex]]. */
    readonly withIndex: AsyncSeq<[T, Nat]>;
    /** Async [[Seq.union]]. */
    union(other: AnyIterable<T>): AsyncSeq<T>;
    /** Async [[Seq.intersection]]. */
    intersection(other: AnyIterable<T>): AsyncSeq<T>;
    /** Async [[Seq.difference]]. */
    difference(other: AnyIterable<T>): AsyncSeq<T>;
    /** Async [[Seq.count]]. */
    count(): Promise<Nat>;
    /** Async [[Seq.max]]. */
    max(this: AsyncSeq<number>): Promise<Option<T>>;
    max(comparer: (left: T, right: T) => Awaitable<number>): Promise<Option<T>>;
    /** Async [[Seq.min]]. */
    min(this: AsyncSeq<number>): Promise<Option<T>>;
    min(comparer: (left: T, right: T) => Awaitable<number>): Promise<Option<T>>;
    /** Async [[Seq.sum]]. */
    sum(this: AsyncSeq<number>): Promise<number>;
}
/** Shorthand for [[AsyncSeq.from]]. */
export declare const asyncSeq: typeof AsyncSeq.from;
/** Creates an [[AsyncIterator]] from a `next` callback. */
export declare function asyncIterator<T>(next: () => Promise<IteratorResult<T>>): AsyncIterator<T>;
