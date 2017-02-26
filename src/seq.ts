import { AsyncSeq } from "./asyncSeq"
import { Builder, MapBuilder, StringBuilder } from "./builder"
import { Comparer, Predicate, thunk } from "./function"
import { multiMapAdd } from "./map"
import { Nat, add, checkNat, incr } from "./math"
import { Option, exists } from "./option"
import { ParallelSeq } from "./parallel"
import { Range } from "./range"
import { toSet } from "./set"

/** IteratorResult for when there are no values left in the sequence. */
export const iterDone: IteratorResult<never> = { value: undefined as never, done: true }

/** IteratorResult to yield a single value and continue. */
export function iterContinue<T>(value: T): IteratorResult<T> {
	return { value, done: false }
}

/**
Wraps an Iterable (or any `() => Iterator<T>`) to provide chainable utilities.
It's not recommended to store a Seq in memory -- use [[toArray]] first.
Also, since elements are computed on demand, use [[eager]] or [[memoize]]
rather than using the same Seq twice.
*/
export class Seq<T> implements Iterable<T> {
	/** Seq with no elements. */
	static empty = new Seq<never>(thunk(iterator(() => iterDone)))

	/** Wrap an Iterable. */
	static from<T>(iterable: Iterable<T>): Seq<T> {
		return new Seq(() => iterable[Symbol.iterator]())
	}

	/** Seq which yields the given values. */
	static of<T>(...values: T[]): Seq<T> {
		return this.from(values)
	}

	/** Repeats the same value forever. */
	static repeat<T>(value: T): Seq<T> {
		return new Seq(() => iterator(() => iterContinue(value)))
	}

	/** Repeats the same sequence forever. */
	static cycle<T>(repeated: Iterable<T>): Seq<T> {
		return new Seq(function*(): Iterator<T> {
			while (true)
				yield* repeated
		})
	}

	/** Yields `initial`, then keeps calling `modify` and yielding the result until it returns `undefined`. */
	static unfold<T>(initial: T | undefined, modify: (current: T) => T | undefined): Seq<T> {
		return new Seq(function*(): Iterator<T> {
			let state = initial
			while (state !== undefined) {
				yield state
				state = modify(state)
			}
		})
	}

	/** Allow to view an Option as a Seq of 0 or 1 values. */
	static ofOption<T>(option: Option<T>): Seq<T> {
		return exists(option) ? Seq.of(option) : Seq.empty
	}

	[Symbol.iterator]: () => Iterator<T>

	/**
	Construct a Seq from any arbitrary function returning an Iterator.

	To support iterating more than once, set up any reused state *within* `getIterator`,
	which is called each time the sequence is iterated over.
	For example: prefer `new Seq(function*() { for (let i = 0; i < 3; i++) yield i })`
	over `let i = 0; new Seq(function*() { ... })`
	*/
	constructor(getIterator: () => Iterator<T>) {
		this[Symbol.iterator] = getIterator
	}

	/** Async utilities. See AsyncSeq for documentation. */
	get async(): AsyncSeq<T> {
		return AsyncSeq.from(this)
	}

	/** Parallel utilities. See ParallelSeq for documentation. */
	get par(): ParallelSeq<T> {
		return this.async.par
	}

	/**
	Eagerly evaluates all elements.
	Use this is you will perform multiple queries to the same Seq
	and you know the queries will use every element.
	(Else, use [[memoize]].)
	*/
	eager(): Seq<T> {
		return Seq.from(Array.from(this))
	}

	/**
	Remembers values that have been computed before.
	(Maintains a single iterator and a cache of previous iteration results.)
	Use this if you will perform multiple queries to the same Seq
	and you don't know if they will use every element.
	*/
	get memoize(): Seq<T> {
		const cache: T[] = []
		const iter = this[Symbol.iterator]()
		let iteratorExhausted = false
		return new Seq(function*(): Iterator<T> {
			// Others are concurrently pushing to `cache`,
			// so must keep checking cache rather than using for-of.
			for (let i = 0; ; i++) {
				if (i < cache.length)
					yield cache[i]
				else if (iteratorExhausted)
					break
				else {
					const { value, done } = iter.next()
					if (done) {
						iteratorExhausted = true
						break
					} else {
						cache.push(value)
						yield value
					}
				}
			}
		})
	}

	/** Write out elements to a Builder and finish the Builder. */
	buildTo<U>(builder: Builder<U, T>): U {
		this.doBuild(builder)
		return builder.finish()
	}

	/** Write out elements to a Builder, but do not finish. */
	doBuild(builder: Builder<any, T>): void {
		for (const element of this)
			builder.add(element)
	}

	/** Array.from(this) */
	toArray(): T[] {
		return Array.from(this)
	}

	/** Set.from(this) */
	toSet(): Set<T> {
		return Set.from(this)
	}

	/** Seq that avoids repeating the same element twice. */
	get unique(): Seq<T> {
		const self = this
		return new Seq(function*(): Iterator<T> {
			const u = new Set()
			for (const element of self) {
				if (!u.has(element)) {
					u.add(element)
					yield element
				}
			}
		})
	}

	/**
	`Map.from(this)` if no `combineValues` is provided.
	See [[MapBuilder]] for documentation on `combineValues`.
	To let multiple values share a key, see [[groupByToMap]].
	*/
	toMap<K, V>(this: Seq<[K, V]>, combineValues?: (left: V, right: V) => V): Map<K, V> {
		return exists(combineValues) ? this.buildTo(new MapBuilder<K, V>(combineValues)) : Map.from(this)
	}

	/**
	Generates a [key, value] pair for each element and
	creates a `Map` from a key to all values with that key.
	*/
	groupBy<K>(toKey: (value: T) => K): Map<K, T[]> {
		const map = new Map<K, T[]>()
		for (const value of this) {
			const key = toKey(value)
			multiMapAdd(map, key, value)
		}
		return map
	}

	/** Like [[groupBy]] but wraps the result as a [[Seq]]. */
	groupBySeq<K>(toKey: (value: T) => K): Seq<[K, T[]]> {
		return seq(this.groupBy(toKey))
	}

	/** Adds all elements to a [[StringBuilder]]. */
	buildToString(this: Seq<string>, separator?: string): string {
		return this.buildTo(new StringBuilder(separator))
	}

	/**
	Stringifies by calling `toString()` on each element.
	Prefer [[buildToString]] to get more control over the output.
	*/
	toString(): string {
		return `Seq(${this.map(x => x.toString()).buildToString(", ")})`
	}

	/** Exists so that `JSON.stringify(seq)` will work as if it were an array. */
	toJSON(): T[] {
		return Array.from(this)
	}

	/** Eagerly performs an action on every element. */
	each(action: (element: T) => void): void {
		for (const element of this)
			action(element)
	}

	/** Runs `getOutput` to produce values for the output Seq. */
	map<U>(getOutput: (value: T) => U): Seq<U> {
		const self = this
		return new Seq(function*(): Iterator<U> {
			for (const element of self)
				yield getOutput(element)
		})
	}

	/**
	Concatenates iterables together, and skips `undefined`.
	Note: as the type indicates, this does not deeply flatten.
	So `Seq.of([1], [[2]]).flatten()` is `Seq.of(1, [2])`.
	*/
	flatten<T>(this: Seq<Option<Iterable<T>>>): Seq<T> {
		const self = this
		return new Seq(function*(): Iterator<T> {
			for (const element of self)
				if (element)
					yield* element
		})
	}

	/** `map(mapper).flatten()` */
	flatMap<U>(mapper: (element: T) => Option<Iterable<U>>): Seq<U> {
		return this.map(mapper).flatten()
	}

	/**
	Adds other iterables onto the end of this.
	Undefined ones will be ignored.
	Equivalent to `seq([this, ...concatWith]).flatten()`.
	*/
	concat(...concatWith: Array<Option<Iterable<T>>>): Seq<T> {
		const self = this
		return new Seq(function*(): Iterator<T> {
			yield* self
			for (const c of concatWith)
				if (c)
					yield* c
		})
	}

	/**
	`map(tryGetOutput).getDefined()`.

	Prefer this over map+filter combinations:
	Prefer `seq.mapDefined(x => optional(f(x), () => g(x))` over `seq.filter(x => f(x)).map(x => g(x))`,
	and `seq.mapDefined(x => keepIf(f(x), y => g(y))` over `seq.map(x => f(x)).filter(y => g(y))`.
	*/
	mapDefined<U>(tryGetOutput: (input: T) => Option<U>): Seq<U> {
		const self = this
		return new Seq(function*(): Iterator<U> {
			for (const element of self) {
				const output = tryGetOutput(element)
				if (exists(output))
					yield output
			}
		})
	}

	/** Filters out undefined values. */
	getDefined<T>(this: Seq<Option<T>>): Seq<T> {
		return this.filter(exists) as Seq<T>
	}

	/** Seq containing only elements satisfying `keepIf`. */
	filter(keepIf: Predicate<T>): Seq<T> {
		const self = this
		return new Seq(function*(): Iterator<T> {
			for (const element of self)
				if (keepIf(element))
					yield element
		})
	}

	/**
	Start with `startAccumulator`, and keep applying `folder` for each element in the Seq.

	Note: Avoid this pattern:

		s.reduce([], (a, e) => returning(a, () => a.push(e)))

	where the value returned by `folder is always the same value.
	It's more honest to just write this as a `for-of` loop mutating a value.
	Complex bodies are also better replaced by a loop.
	*/
	reduce<U>(startAccumulator: U, folder: (accumulator: U, element: T) => U): U {
		let accumulator = startAccumulator
		for (const element of this)
			accumulator = folder(accumulator, element)
		return accumulator
	}

	/**
	Returns true if `searchFor` is in the Seq somewhere.
	Same as `some(eq(searchFor))` or `some(x => equals(searchFor, x))`.
	*/
	contains(searchFor: T, equals?: Comparer<T>): boolean {
		for (const element of this)
			if (exists(equals) ? equals(element, searchFor) : element === searchFor)
				return true
		return false
	}

	/**
	Return the first element satisfying a predicate.
	Same as `filter(predicate).first`.
	*/
	find(predicate: Predicate<T>): Option<T> {
		for (const element of this)
			if (predicate(element))
				return element
		return undefined
	}

	/** True iff iteration immediately stops. */
	get isEmpty(): boolean {
		return this[Symbol.iterator]().next().done
	}

	/**
	True iff some element satisfies `predicate`.
	For information about that element use `find`.
	*/
	some(predicate: (element: T) => boolean): boolean {
		for (const element of this)
			if (predicate(element))
				return true
		return false
	}

	/** False iff any element does not satisfy `predicate`. */
	every(predicate: (element: T) => boolean): boolean {
		for (const element of this)
			if (!predicate(element))
				return false
		return true
	}

	/**
	Seq with a single value prepended to the front.
	Same as `Seq.single(value).concat(this)`.
	*/
	unshift(value: T): Seq<T> {
		const self = this
		return new Seq(function*(): Iterator<T> {
			yield value
			yield* self
		})
	}

	/** First value or `undefined`. */
	get first(): Option<T> {
		return this[Symbol.iterator]().next().value
	}

	/** All values but the first. Does nothing for empty sequences. */
	get tail(): Seq<T> {
		return this.drop(1)
	}

	/** True iff the sequences contain the same elements in the same order */
	equals(other: Iterable<T>, elementEqual?: Comparer<T>): boolean {
		const ia = this[Symbol.iterator]()
		const ib = other[Symbol.iterator]()
		while (true) {
			const { value: va, done: da } = ia.next()
			const { value: vb, done: db } = ib.next()
			if (da || db)
				return da === db
			else if (exists(elementEqual) ? !elementEqual(va, vb) : va !== vb)
				return false
		}
	}

	/** First N elements of the sequence. */
	take(numberToTake: Nat): Seq<T> {
		checkNat(numberToTake)
		const self = this
		return new Seq(function*(): Iterator<T> {
			if (numberToTake === 0)
				return
			let n = numberToTake
			for (const element of self) {
				yield element
				n--
				if (n === 0)
					break
			}
		})
	}

	/**
	Takes elements so long as `predicate` is true.
	Unlike `filter`, stops as soon as `predicate` is false and does not continue looking.
	*/
	takeWhile(predicate: (element: T) => boolean): Seq<T> {
		const self = this
		return new Seq(function*(): Iterator<T> {
			for (const element of self) {
				if (predicate(element))
					yield element
				else
					break
			}
		})
	}

	/** Seq without the first `numberToDrop` elements. */
	drop(numberToDrop: Nat): Seq<T> {
		checkNat(numberToDrop)
		const self = this
		return new Seq(function*(): Iterator<T> {
			const iter = self[Symbol.iterator]()
			for (let n = numberToDrop; n !== 0; n--)
				if (iter.next().done)
					return
			yield* iterableOfIterator(iter)
		})
	}

	/** Drops elements so long as `predicate` is true. */
	dropWhile(predicate: (element: T) => boolean): Seq<T> {
		const self = this
		return new Seq(function*(): Iterator<T> {
			const iter = self[Symbol.iterator]()
			while (true) {
				const { value, done } = iter.next()
				if (done)
					break
				if (!predicate(value)) {
					yield value
					yield* iterableOfIterator(iter)
				}
			}
		})
	}

	/**
	Combines values in two sequences.
	This is only as long as the shorter sequence.
	*/
	zip<U, V>(other: Iterable<U>, zipper: (left: T, right: U) => V): Seq<V>
	zip<U>(other: Iterable<U>): Seq<[T, U]>
	zip<U>(other: Iterable<U>, zipper?: (left: T, right: U) => any): Seq<any> {
		return new Seq(() => {
			const leftIter = this[Symbol.iterator]()
			const rightIter = other[Symbol.iterator]()
			return iterator(() => {
				const { value: leftValue, done: leftDone } = leftIter.next()
				if (leftDone)
					return iterDone
				const { value: rightValue, done: rightDone } = rightIter.next()
				if (rightDone)
					return iterDone
				return iterContinue(
					exists(zipper) ? zipper(leftValue, rightValue) : [leftValue, rightValue])
			})
		})
	}

	/** Seq where each element is paired with its index, starting with 0. */
	get withIndex(): Seq<[T, Nat]> {
		return this.zip(Range.nats)
	}

	/** Eagerly evaluates, sorts it, then wraps in a Seq again. */
	sort(this: Seq<number> | Seq<string>): Seq<T>
	sort(comparer: (left: T, right: T) => number): Seq<T>
	sort(comparer?: (left: T, right: T) => number): Seq<T> {
		return seq(this.toArray().sort(comparer))
	}

	/** Eagerly evaluates, sorts it, then wraps in a Seq again. */
	reverse(): Seq<T> {
		return seq(this.toArray().reverse())
	}

	/** Seq containing the elements in both this and other. */
	union(other: Iterable<T>): Seq<T> {
		return this.concat(other).unique
	}

	/** Eagerly evaluates `other` and returns a Seq of the elements in this that are also in `other`. */
	intersection(other: Iterable<T>): Seq<T> {
		const asSet = toSet(other)
		return this.filter(element => asSet.has(element))
	}

	/** Eagerly evaluates `other` and returns a Seq of the elements in this not in `other`. */
	difference(other: Iterable<T>): Seq<T> {
		const asSet = toSet(other)
		return this.filter(element => !asSet.has(element))
	}

	/**
	Evaluates all elements and returns their count.
	If you want to do other things in addition to counting, consider using `eager` first so the Seq is evaluated only once.
	*/
	count(): Nat {
		return this.reduce(0, incr)
	}

	/**
	Returns the greatest element.
	If `comparer` is provided, it should return a value > 0 if `left` is the new maximum.
	*/
	max(this: Seq<number>): Option<T>
	max(comparer: (left: T, right: T) => number): Option<T>
	max(comparer?: (left: T, right: T) => number): Option<T> {
		const iter = this[Symbol.iterator]()
		const { value, done } = iter.next()
		if (done)
			return undefined
		else {
			let max = value
			for (const element of (iter as any))
				if (exists(comparer) ? comparer(element, max) > 0 : element > max)
					max = element
			return max
		}
	}

	/**
	Returns the least element.
	If `comparer` is provided, it should return a value < 0 if `left` is the new maximum.
	*/
	min(this: Seq<number>): Option<T>
	min(comparer: (left: T, right: T) => number): Option<T>
	min(comparer?: (left: T, right: T) => number): Option<T> {
		const iter = this[Symbol.iterator]()
		const { value, done } = iter.next()
		if (done)
			return undefined
		else {
			let min = value
			for (const element of this)
				if (exists(comparer) ? comparer(element, min) < 0 : element < min)
					min = element
			return min
		}
	}

	/** Sum of numbers. */
	sum(this: Seq<number>): number {
		return this.reduce(0, add)
	}
}

/** Shorthand for [[Seq.from]]. */
export const seq = Seq.from

/** Creates an iterator from a `next` callback. */
export function iterator<T>(next: () => IteratorResult<T>): Iterator<T> {
	return { next }
}

/**
Create a single-use Iterable from an Iterator.
Useful for calling `yield*`.
*/
export function iterableOfIterator<T>(iterator: Iterator<T>): Iterable<T> {
	return Symbol.iterator in iterator
		? (iterator as any as Iterable<T>)
		: { [Symbol.iterator]: () => iterator }
}
