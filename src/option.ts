import { Comparer, Predicate } from "./function"

/** Value which may be `undefined`. */
export type Option<T> = T | undefined

/**
 * Value which may be `null` or `undefined`.
 * Pass these into `nullable` to make them usable.
*/
export type Nullable<T> = T | null | undefined

/** Convert a value which may be `null` to one which may be `undefined`. */
export function optionify<T>(nullable: Nullable<T>): Option<T> {
	return nullable === null ? undefined : nullable
}

/** True for any value but `undefined`. */
export function exists<T>(option: Option<T>): option is T {
	return option !== undefined
}

/**
Create an optional value if some condition is true.
Never write `else return undefined` again!
*/
export function optional<T>(condition: boolean, result: () => T): Option<T> {
	return condition ? result() : undefined
}

/** Return the value iff the predicate is satisfied. */
export function keepIf<T>(value: T, predicate: Predicate<T>): Option<T> {
	return predicate(value) ? value : undefined
}

/** Get the value of an option or throw an error. */
export function orThrow<T>(option: Option<T>, error?: () => Error): T {
	if (exists(option))
		return option
	else
		throw exists(error) ? error() : new TypeError("Option was undefined.")
}

/**
Use an option iff it exists.
This is like the safe-navigation ("one-eyed elvis") operator: `iff(foo, f => f.bar)` is `foo?.bar`.
*/
export function iff<T, U>(option: Option<T>, map: (value: T) => Option<U>): Option<U> {
	return exists(option) ? map(option) : undefined
}

/**
Try another method of getting an option if it doesn't already exist.
This is like the elvis operator: `or(foo, bar)` is `foo ?: bar`.
*/
export function or<T>(option: Option<T>, getDefault: () => T): T
export function or<T>(option: Option<T>, getDefault: () => Option<T>): Option<T>
export function or<T>(option: Option<T>, getDefault: () => Option<T>): Option<T> {
	return exists(option) ? option : getDefault()
}

/** Combine two options only if they both exist. */
export function and<T, U, V>(a: Option<T>, b: Option<U>, combine: (t: T, u: U) => Option<V>): Option<V> {
	return exists(a) && exists(b) ? combine(a, b) : undefined
}

/**
True iff `a === b` or `equal(a, b)`.
Does not call `equal` if either input is undefined.
*/
export function equalOptions<T>(a: Option<T>, b: Option<T>, equal: Comparer<T>): boolean {
	return a === b || exists(a) && exists(b) && equal(a, b)
}
