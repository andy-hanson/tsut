import { Awaitable } from "./async"
import { Nat, checkNat } from "./math"
import { Option, exists } from "./option"

/** Function that does nothing and returns its input. */
export function identity<T>(value: T): T {
	return value
}

/** `x => fn2(fn1(x))`. */
export function compose<T, U, V>(f1: Fn1<T, U>, f2: Fn1<U, V>): Fn1<T, V> {
	return (input: T) => f2(f1(input))
}

/** Shorthand for a function with 1 argument. */
export type Fn1<T, U> = (t: T) => U

/** Shorthand for a function with 2 arguments. */
export type Fn2<T, U, V> = (t: T, u: U) => V

/** Shorthand for a function with 3 arguments. */
export type Fn3<T, U, V, W> = (t: T, u: U, v: V) => W

/** Shorthand for a function with 4 arguments. */
export type Fn4<T, U, V, W, X> = (t: T, u: U, v: V, w: W) => X

/** Function that uses a T to perform side effects. */
export type Action<T> = (value: T) => void

/** Function that tests some condition on a value. */
export type Predicate<T> = (value: T) => boolean

/** Async [[Predicate]]. */
export type PredicateAsync<T> = (value: T) => Awaitable<boolean>

/** Function that compares two T values. */
export type Comparer<T> = (a: T, b: T) => boolean

/** Async [[Comparer]]. */
export type ComparerAsync<T> = (a: T, b: T) => Awaitable<boolean>

/**
Function that prepends arguments, then calls another function.
`(f, ...args) => (...moreArgs) => f(...args, ...moreArgs)`
*/
export function partial<T, U, V>(f: Fn2<T, U, V>, t: T): Fn1<U, V>
export function partial<T, U, V, W>(f: Fn3<T, U, V, W>, t: T): Fn2<U, V, W>
export function partial<T, U, V, W>(f: Fn3<T, U, V, W>, t: T, u: U): Fn1<V, W>
export function partial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, t: T): Fn3<U, V, W, X>
export function partial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, t: T, u: U): Fn2<V, W, X>
export function partial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, t: T, u: U, v: V): Fn1<W, X>
export function partial(f: Function, ...args: any[]): Function { // tslint:disable-line ban-types
	return (...moreArgs: any[]) => f(...args, ...moreArgs)
}

/**
Function that calls another function with appended arguments.
`(f, ...args) => (...moreArgs) => f(...moreArgs, args)`
*/
export function rpartial<T, U, V>(f: Fn2<T, U, V>, u: U): Fn1<T, V>
export function rpartial<T, U, V, W>(f: Fn3<T, U, V, W>, v: V): Fn2<T, U, W>
export function rpartial<T, U, V, W>(f: Fn3<T, U, V, W>, u: U, v: V): Fn1<T, W>
export function rpartial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, w: W): Fn3<T, U, V, X>
export function rpartial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, v: V, w: W): Fn2<T, U, X>
export function rpartial<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, u: U, v: V, w: W): Fn1<T, X>
export function rpartial(f: Function, ...args: any[]): Function { // tslint:disable-line ban-types
	return (...moreArgs: any[]) => f(...moreArgs, ...args)
}

/** Performs `action` `times` times. */
export function doTimes(times: Nat, action: (index: number) => void): void {
	checkNat(times)
	for (let i = 0; i < times; i++)
		action(i)
}

/** Performs some action before returning `value`. */
export function returning<T>(value: T, action: (value: T) => void): T {
	action(value)
	return value
}

/** Like `() => value`, but ensures `value` is calculated eagerly. */
export function thunk<T>(value: T): () => T {
	return () => value
}

/** Like `thunk`, but computes the value on the first access. */
export function lazy<T>(f: () => T): () => T {
	let value: Option<T>
	return () => value === undefined ? value = f() : value
}

/**
Performs several functions successively on a value.
`pipe(x, f, g)` is equivalent to `g(f(x))`.
*/
export function pipe<T, U, V>(start: T, f0: Fn1<T, U>, f1: Fn1<U, V>): V
export function pipe<T, U, V, W>(start: T, f0: Fn1<T, U>, f1: Fn1<U, V>, f2: Fn1<V, W>): W
export function pipe<T, U, V, W, X>(start: T, f0: Fn1<T, U>, f1: Fn1<U, V>, f2: Fn1<V, W>, f3: Fn1<W, X>): X
export function pipe(value: any, ...functions: Function[]): any { // tslint:disable-line ban-types
	for (const f of functions)
		value = f(value)
	return value
}

/** Function that performs an action before calling a function. */
export function before<T extends Function>(f: T, doBefore: () => void): T { // tslint:disable-line ban-types
	return ((...args: any[]) => {
		doBefore()
		return f(...args)
	}) as any as T
}

/**
Function that performs some action with the result of a function.
Equivalent to (...args) => returning(f(...args), doAfter))
*/
export function after<T, U>(f: Fn1<T, U>, doAfter: Action<U>): Fn1<T, U>
export function after<T, U, V>(f: Fn2<T, U, V>, doAfter: Action<V>): Fn2<T, U, V>
export function after<T, U, V, W>(f: Fn3<T, U, V, W>, doAfter: Action<W>): Fn3<T, U, V, W>
export function after<T, U, V, W, X>(f: Fn4<T, U, V, W, X>, doAfter: Action<X>): Fn4<T, U, V, W, X>
export function after<F extends Function>(f: F, doAfter: (res: any) => void): F { // tslint:disable-line ban-types
	return ((...args: any[]) => {
		const res = f(...args)
		doAfter(res)
		return res
	}) as any
}

/** Type of memoized functions: the function type with accessible `cache`. */
export type MemoizedFn<In extends object, Out, F> = F & { cache: WeakMap<In, Out> }

/**
Remembers previous calls to a function and does not recompute on the same inputs twice.
The In type must be an object type.
The Out type must not be possibly `undefined`,
as that value is used to indicate that the function hasn't been called yet.
The function type is a type parameter so that intellisense knows the parameter names.
*/
export function memoize<In extends object, Out, F extends (input: In) => Out>(f: F): MemoizedFn<In, Out, F> {
	const cache = new WeakMap<In, Out>()

	const memoized = (input: In): Out => {
		const cached = cache.get(input)
		if (exists(cached))
			return cached
		else {
			const out = f(input)
			cache.set(input, out)
			return out
		}
	}

	const m = memoized as MemoizedFn<In, Out, F>
	m.cache = cache
	return m
}

/** Type of memoized functions with 2 arguments. */
export type MemoizedFn2<A extends object, B extends object, Out, F> = F & { cache: WeakMap<A, WeakMap<B, Out>> }

/** [[memoize]] for a function with 2 arguments. */
export function memoize2<A extends object, B extends object, Out, F extends (a: A, b: B) => Out>(f: F): MemoizedFn2<A, B, Out, F> {
	const aCache = new WeakMap<A, WeakMap<B, Out>>()

	const memoized = (a: A, b: B): Out => {
		let bCache = aCache.get(a)
		if (!exists(bCache)) {
			bCache = new WeakMap<B, Out>()
			aCache.set(a, bCache)
		}

		const cached = bCache.get(b)
		if (exists(cached))
			return cached
		else {
			const out = f(a, b)
			bCache.set(b, out)
			return out
		}
	}

	const m = memoized as MemoizedFn2<A, B, Out, F>
	m.cache = aCache
	return m
}
