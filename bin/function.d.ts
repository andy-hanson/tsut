import { Awaitable } from "./async";
import { Nat } from "./math";
/** Function that does nothing and returns its input. */
export declare function identity<T>(value: T): T;
/** `x => fn2(fn1(x))`. */
export declare function compose<T, U, V>(f1: Fn1<T, U>, f2: Fn1<U, V>): Fn1<T, V>;
/** Shorthand for a function with 1 argument. */
export declare type Fn1<T, U> = (t: T) => U;
/** Shorthand for a function with 2 arguments. */
export declare type Fn2<T, U, V> = (t: T, u: U) => V;
/** Shorthand for a function with 3 arguments. */
export declare type Fn3<T, U, V, W> = (t: T, u: U, v: V) => W;
/** Shorthand for a function with 4 arguments. */
export declare type Fn4<T, U, V, W, X> = (t: T, u: U, v: V, w: W) => X;
/** Function that uses a T to perform side effects. */
export declare type Action<T> = (value: T) => void;
/** Function that tests some condition on a value. */
export declare type Predicate<T> = (value: T) => boolean;
/** Async [[Predicate]]. */
export declare type PredicateAsync<T> = (value: T) => Awaitable<boolean>;
/** Function that compares two T values. */
export declare type Comparer<T> = (a: T, b: T) => boolean;
/** Async [[Comparer]]. */
export declare type ComparerAsync<T> = (a: T, b: T) => Awaitable<boolean>;
/**
Function that prepends arguments, then calls another function.
`(f, ...args) => (...moreArgs) => f(...args, ...moreArgs)`
*/
export declare function partial<T, U, V>(f: Fn2<T, U, V>, t: T): Fn1<U, V>;
export declare function partial<T, U, V, W>(f: Fn3<T, U, V, W>, t: T): Fn2<U, V, W>;
export declare function partial<T, U, V, W>(f: Fn3<T, U, V, W>, t: T, u: U): Fn1<V, W>;
export declare function partial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, t: T): Fn3<U, V, W, X>;
export declare function partial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, t: T, u: U): Fn2<V, W, X>;
export declare function partial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, t: T, u: U, v: V): Fn1<W, X>;
/**
Function that calls another function with appended arguments.
`(f, ...args) => (...moreArgs) => f(...moreArgs, args)`
*/
export declare function rpartial<T, U, V>(f: Fn2<T, U, V>, u: U): Fn1<T, V>;
export declare function rpartial<T, U, V, W>(f: Fn3<T, U, V, W>, v: V): Fn2<T, U, W>;
export declare function rpartial<T, U, V, W>(f: Fn3<T, U, V, W>, u: U, v: V): Fn1<T, W>;
export declare function rpartial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, w: W): Fn3<T, U, V, X>;
export declare function rpartial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, v: V, w: W): Fn2<T, U, X>;
export declare function rpartial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, u: U, v: V, w: W): Fn1<T, X>;
/** Performs `action` `times` times. */
export declare function doTimes(times: Nat, action: (index: number) => void): void;
/** Performs some action before returning `value`. */
export declare function returning<T>(value: T, action: (value: T) => void): T;
/** Like `() => value`, but ensures `value` is calculated eagerly. */
export declare function thunk<T>(value: T): () => T;
/** Like `thunk`, but computes the value on the first access. */
export declare function lazy<T>(f: () => T): () => T;
/**
Performs several functions successively on a value.
`pipe(x, f, g)` is equivalent to `g(f(x))`.
*/
export declare function pipe<T, U, V>(start: T, f0: Fn1<T, U>, f1: Fn1<U, V>): V;
export declare function pipe<T, U, V, W>(start: T, f0: Fn1<T, U>, f1: Fn1<U, V>, f2: Fn1<V, W>): W;
export declare function pipe<T, U, V, W, X>(start: T, f0: Fn1<T, U>, f1: Fn1<U, V>, f2: Fn1<V, W>, f3: Fn1<W, X>): X;
/** Function that performs an action before calling a function. */
export declare function before<T extends Function>(f: T, doBefore: () => void): T;
/**
Function that performs some action with the result of a function.
Equivalent to (...args) => returning(f(...args), doAfter))
*/
export declare function after<T, U>(f: Fn1<T, U>, doAfter: Action<U>): Fn1<T, U>;
export declare function after<T, U, V>(f: Fn2<T, U, V>, doAfter: Action<V>): Fn2<T, U, V>;
export declare function after<T, U, V, W>(f: Fn3<T, U, V, W>, doAfter: Action<W>): Fn3<T, U, V, W>;
export declare function after<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, doAfter: Action<X>): Fn4<T, U, V, W, X>;
/** Type of memoized functions: the function type with accessible `cache`. */
export declare type MemoizedFn<In extends object, Out, F> = F & {
    cache: WeakMap<In, Out>;
};
/**
Remembers previous calls to a function and does not recompute on the same inputs twice.
The In type must be an object type.
The Out type must not be possibly `undefined`,
as that value is used to indicate that the function hasn't been called yet.
The function type is a type parameter so that intellisense knows the parameter names.
*/
export declare function memoize<In extends object, Out, F extends (input: In) => Out>(f: F): MemoizedFn<In, Out, F>;
/** Type of memoized functions with 2 arguments. */
export declare type MemoizedFn2<A extends object, B extends object, Out, F> = F & {
    cache: WeakMap<A, WeakMap<B, Out>>;
};
/** [[memoize]] for a function with 2 arguments. */
export declare function memoize2<A extends object, B extends object, Out, F extends (a: A, b: B) => Out>(f: F): MemoizedFn2<A, B, Out, F>;
