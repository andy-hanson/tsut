/// <reference path="shims.ts" />

import { Seq } from "./seq"

/** Converts an iterable to a Set if it isn't one already. */
export function toSet<T>(values: Iterable<T>): Set<T> {
	return values instanceof Set ? values : Set.from(values)
}

/** Sets `target = target ⋃ source` */
export function unionMutate<T>(target: Set<T>, source: Iterable<T>): void {
	for (const element of source)
		target.add(element)
}

/** Sets `target = target ⋂ source` */
export function intersectionMutate<T>(target: Set<T>, source: Iterable<T>): void {
	const sourceSet = toSet(source)
	filterMutateSet(target, element => sourceSet.has(element))
}

/** Sets `target = target - source` */
export function differenceMutate<T>(target: Set<T>, source: Iterable<T>): void {
	const sourceSet = toSet(source)
	filterMutateSet(target, element => !sourceSet.has(element))
}

/** Set containing every element in every argument. */
export function union<T>(...args: Array<Iterable<T>>): Set<T> {
	const s = new Set<T>()
	for (const arg of args)
		unionMutate(s, arg)
	return s
}

/**
Set containing only the elements common to both arguments.
This operation is faster when at least one argument is a Set.
*/
export function intersection<T>(left: Iterable<T>, right: Iterable<T>): Set<T> {
	const [a, b]: [Set<T>, Iterable<T>] = left instanceof Set
		? [left, right]
		: right instanceof Set
		? [right, left]
		: [Set.from(left), right]

	const out = new Set()
	for (const value of b)
		if (a.has(value))
			out.add(value)
	return out
}

/** Set containing the only elements in `left` that are not in `right`. */
export function difference<T>(left: Iterable<T>, right: Iterable<T>): Set<T> {
	return Seq.from(left).difference(right).toSet()
}

/**
Throws out values in a set that do not satisfy a predicate.
(For an immutable version, use `seq(s).filter(predicate).toSet()`.)
*/
export function filterMutateSet<T>(set: Set<T>, predicate: (value: T) => boolean): void {
	for (const value of set)
		if (!predicate(value))
			set.delete(value)
}
