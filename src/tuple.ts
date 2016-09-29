import { Fn1 } from "./function"

/** First element of a tuple. */
export function _1st<T>(tuple: [T, any] | [T, any, any] | [T, any, any, any]): T {
	return tuple[0]
}

/** Second element of a tuple. */
export function _2nd<T>(tuple: [any, T] | [any, T, any] | [any, T, any, any]): T {
	return tuple[1]
}

/** Third element of a tuple. */
export function _3rd<T>(tuple: [any, any, T] | [any, any, T, any]): T {
	return tuple[2]
}

/** Fourth element of a tuple. */
export function _4th<T>(tuple: [any, any, any, T]): T {
	return tuple[3]
}

/** Applies a function to the first element of a tuple and returns the new tuple. */
export function mod1st<T1, T2, U>(tuple: [T1, U], f: Fn1<T1, T2>): [T2, U]
export function mod1st<T1, T2, U, V>(tuple: [T1, U, V], f: Fn1<T1, T2>): [T2, U, V]
export function mod1st<T1, T2, U, V, W>(tuple: [T1, U, V, W], f: Fn1<T1, T2>): [T2, U, V, W]
export function mod1st(tuple: any[], f: Fn1<any, any>): any[] {
	return [f(tuple[0]), ...tuple.slice(1)]
}

/** Applies a function to the first element of a tuple and returns the new tuple. */
export function mod2nd<T1, T2, U>(tuple: [U, T1], f: Fn1<T1, T2>): [U, T2]
export function mod2nd<T1, T2, U, V>(tuple: [U, T1, V], f: Fn1<T1, T2>): [U, T2, V]
export function mod2nd<T1, T2, U, V, W>(tuple: [U, T1, V, W], f: Fn1<T1, T2>): [U, T2, V, W]
export function mod2nd(tuple: any[], f: Fn1<any, any>): any[] {
	return [tuple[0], f(tuple[1]), ...tuple.slice(2)]
}

/** Applies a function to the third element of a tuple and returns the new tuple. */
export function mod3rd<T1, T2, U, V>(tuple: [U, V, T1], f: Fn1<T1, T2>): [U, V, T2]
export function mod3rd<T1, T2, U, V, W>(tuple: [U, V, T2, W], f: Fn1<T1, T2>): [U, V, T2, W]
export function mod3rd(tuple: any[], f: Fn1<any, any>): any[] {
	return [tuple[0], tuple[1], f(tuple[2]), ...tuple.slice(3)]
}

/** Applies a function to the third element of a tuple and returns the new tuple. */
export function mod4th<T1, T2, U, V, W>(tuple: [U, V, W, T1], f: Fn1<T1, T2>): [U, V, W, T2] {
	return [tuple[0], tuple[1], tuple[2], f(tuple[3])]
}
