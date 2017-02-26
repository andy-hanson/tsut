import { Awaitable, Deferred, deferred, toPromise } from "./async"
import { ArrayBuilder, Builder, MapBuilder, SetBuilder, StringBuilder } from "./builder"
import { ComparerAsync, PredicateAsync, identity, thunk } from "./function"
import { multiMapAdd } from "./map"
import { Nat, add, checkNat, incr } from "./math"
import { Option, exists, optional } from "./option"
import { ParallelSeq } from "./parallel"
import { Range } from "./range"
import { Seq, iterContinue, iterDone } from "./seq"

/**
Anything that provides the `asyncIterator` method is considered iterable.
Using this instead of a `Symbol.asyncIterator` because that can't currently be typechecked
(https://github.com/Microsoft/TypeScript/issues/5579)
*/
export interface AsyncIterable<T> {
	asyncIterator(): AsyncIterator<T>
}

/**
Async version of Iterator.
Copied from https://github.com/Microsoft/TypeScript/issues/11326
See also https://github.com/tc39/proposal-async-iteration
*/
export interface AsyncIterator<T> {
	next(value?: any): Promise<IteratorResult<T>>
	return?(value?: any): Promise<IteratorResult<T>>
	throw?(e?: any): Promise<IteratorResult<T>>
}

/**
Type used for functions that may accept any iterable object.
Useful with `getAsyncIterator`.
*/
export type AnyIterable<T> = Iterable<T> | AsyncIterable<T>

/** Gets an [[AsyncIterator]] from any iterable object, converting if it has a synchronous iterator. */
export function getAsyncIterator<T>(t: AnyIterable<T>): AsyncIterator<T> {
	return typeof t === "string"
		// Must handle strings specially because using the "in" operator throws a TypeError
		? asyncIteratorOfIterator((t as string)[Symbol.iterator]() as any as Iterator<T>)
		: "asyncIterator" in t
		? (t as AsyncIterable<T>).asyncIterator()
		: asyncIteratorOfIterator((t as Iterable<T>)[Symbol.iterator]())
}

/** Converts an Iterator to an [[AsyncIterator]]. */
function asyncIteratorOfIterator<T>(iter: Iterator<T>): AsyncIterator<T> {
	const asyncIter: AsyncIterator<T> = { next: (value?: any) => Promise.resolve(iter.next(value)) }
	if (iter.return)
		asyncIter.return = (value?: any) => Promise.resolve(iter.return!(value))
	if (iter.throw)
		asyncIter.throw = (value?: any) => Promise.resolve(iter.throw!(value))
	return asyncIter
}

/**
Interface for a push-stream to write to.
Used by [[AsyncSeq.fromPush]].
*/
export interface Pushable<T> {
	/** Add a new element to the sequence. */
	push(element: T): void

	/**
	 * End the sequence in an error.
	 * The user of the stream won't see the error until they have used all queued results.
	 * This must be the last function called.
	 */
	error(error: Error): void

	/**
	 * End the sequence.
	 * Without this, the sequence will hang, waiting for the push that never comes.
	 * This must be the last function called.
	 */
	finish(): void
}

/**
Wraps an [[AsyncIterable]] (or any `() => AsyncIterator<T>`) to provide chainable utilities.
There's no way to directly turn an [[AsyncSeq]] back into a [[Seq]],
but you can asynchronously finish with [[eager]], [[toArray]], [[each]], [[reduce]].
*/
export class AsyncSeq<T> implements AsyncIterable<T> {
	/** AsyncSeq with no elements. */
	static empty = new AsyncSeq<never>(
		thunk(asyncIterator(thunk(
			Promise.resolve({ value: undefined, done: true })))))

	/**
	Wraps any iterator.
	Works for `Iterable<T>`, `AsyncIterable<T>`, or a Promise for either.
	*/
	static from<T>(seq: Awaitable<AnyIterable<T>>): AsyncSeq<T> {
		return seq instanceof Promise
			? new AsyncSeq<T>(() => {
				let iter: Option<AsyncIterator<T>>
				return asyncIterator(async () => {
					if (!exists(iter))
						iter = getAsyncIterator(await seq)
					return iter.next()
				})
			})
			: new AsyncSeq<T>(() => getAsyncIterator(seq))
	}

	/** AsyncSeq which yields the given values. */
	static of<T>(...values: T[]): AsyncSeq<T> {
		return this.from(values)
	}

	/** Yields `initial`, then keeps calling `modify` and yielding the result until it returns `undefined`. */
	static unfold<T>(initial: T | undefined, modify: (current: T) => Awaitable<T | undefined>): AsyncSeq<T> {
		return new AsyncSeq(() => {
			let state = initial
			return asyncIterator(async () => {
				if (state !== undefined) {
					const result = iterContinue(state)
					state = await modify(state)
					return result
				} else
					return iterDone
			})
		})
	}

	/**
	Converts a push-stream to an AsyncSeq.

	`pusherUser` will be called when the sequence is iterated over. (Use [[eager]]/[[memoize]] so that this only happens once.)
	Having utilities for event emitters might be preferrable to using this, but that's not implemented yet.

	Internally keeps a queue of values that have been pushed but not yet pulled, or
	keeps a queue of promises that have been pulled but have not yet been pushed to (resolved).
	*/
	static fromPush<T>(pusherUser: (pusher: Pushable<T>) => void): AsyncSeq<T> {
		return new AsyncSeq<T>(() => {
			const enum StateKind { Going, Errored, Finished }
			type State = { kind: StateKind.Going, deferreds: Array<Deferred<IteratorResult<T>>> } |
				{ kind: StateKind.Errored, error: Error } |
				{ kind: StateKind.Finished }

			let curState: State = { kind: StateKind.Going, deferreds: [] }
			// Results that have been pushed that have not yet been pulled.
			const queued: T[] = []

			function mustBeGoing(newState: StateKind): Array<Deferred<IteratorResult<T>>> {
				if (curState.kind === StateKind.Going)
					return curState.deferreds
				else
					throw new Error(`"${curStateString(newState)}" called after "${curStateString(curState.kind)}"`)
			}

			function curStateString(state: StateKind): string {
				switch (state) {
					case StateKind.Going: return "going"
					case StateKind.Errored: return "error"
					case StateKind.Finished: return "finish"
				}
			}

			pusherUser({
				push(element: T): void {
					const deferreds = mustBeGoing(StateKind.Going)
					if (deferreds.length)
						deferreds.shift()!.resolve(iterContinue(element))
					else
						queued.push(element)
				},

				error(error: Error): void {
					const deferreds = mustBeGoing(StateKind.Errored)
					for (const d of deferreds)
						d.reject(error)
					curState = { kind: StateKind.Errored, error }
				},

				finish(): void {
					const deferreds = mustBeGoing(StateKind.Finished)
					for (const d of deferreds)
						d.resolve(iterDone)
					curState = { kind: StateKind.Finished }
				}
			})

			return asyncIterator((): Promise<IteratorResult<T>> => {
				if (queued.length)
					return Promise.resolve(iterContinue(queued.shift()))
				else {
					switch (curState.kind) {
						case StateKind.Going: {
							const [d, promise] = deferred<IteratorResult<T>>()
							// Elements may still be pushed, so add a new deferred.
							curState.deferreds.push(d)
							return promise
						}
						case StateKind.Errored:
							return Promise.reject(curState.error)
						case StateKind.Finished:
							return Promise.resolve(iterDone)
					}
					// TODO: https://github.com/Microsoft/TypeScript/issues/11572
					throw new Error("Unreachable")
				}
			})
		})
	}

	/**
	Construct an AsyncSeq from any arbitrary function returning an [[AsyncIterator]].
	Async version of the [[Seq]] constructor.
	*/
	constructor(readonly asyncIterator: () => AsyncIterator<T>) {}

	/** Wraps this in a [[ParallelSeq]]. */
	get par(): ParallelSeq<T> {
		return new ParallelSeq(this)
	}

	/** [[toArray]] wrapped as a [[Seq]]. */
	async eager(): Promise<Seq<T>> {
		return Seq.from(await this.toArray())
	}

	/** Async [[Seq.memoize]]. */
	get memoize(): AsyncSeq<T> {
		// All iterators share the cache and the same backing iterator, which may only run once.
		const cache: T[] = []
		const iter = this.asyncIterator()
		let iteratorExhausted = false
		return new AsyncSeq<T>(() => {
			// Each iterator has its own `i`
			let i = 0
			return asyncIterator<T>(async () => {
				if (i < cache.length) {
					const cached = cache[i]
					i++
					return iterContinue(cached)
				}
				else if (iteratorExhausted)
					return iterDone
				else {
					const { value, done } = await iter.next()
					if (done) {
						iteratorExhausted = true
						return iterDone
					} else {
						cache.push(value)
						i++
						return iterContinue(value)
					}
				}
			})
		})
	}

	/** Async [[Seq.buildTo]]. */
	async buildTo<U>(builder: Builder<U, T>): Promise<U> {
		await this.doBuild(builder)
		return builder.finish()
	}

	/** Async [[Seq.doBuilt]]. */
	doBuild(builder: Builder<any, T>): Promise<void> {
		return this.each(element => builder.add(element))
	}

	/** Async [[Seq.toArray]]. */
	toArray(): Promise<T[]> {
		return this.buildTo(new ArrayBuilder<T>())
	}

	/** Async [[Seq.toSet]]. */
	toSet(): Promise<Set<T>> {
		return this.buildTo(new SetBuilder<T>())
	}

	/** Async [[Seq.unique]]. */
	get unique(): AsyncSeq<T> {
		return new AsyncSeq(() => {
			const u = new Set()
			const iter = this.asyncIterator()
			return asyncIterator(async () => {
				while (true) {
					const { value, done } = await iter.next()
					if (done)
						return iterDone
					else {
						if (!u.has(value)) {
							u.add(value)
							return iterContinue(value)
						}
					}
				}
			})
		})
	}

	/** Async [[Seq.toMap]]. */
	toMap<K, V>(this: AsyncSeq<[K, V]>, combineValues?: (left: V, right: V) => V): Promise<Map<K, V>> {
		return this.buildTo(new MapBuilder<K, V>(combineValues))
	}

	/** Async [[Seq.groupBy]]. */
	async groupBy<K>(toKey: (element: T) => Awaitable<K>): Promise<Map<K, T[]>> {
		const map = new Map<K, T[]>()
		await this.each(async value => {
			const key = await toKey(value)
			multiMapAdd(map, key, value)
		})
		return map
	}

	/** Async [[Seq.groupBySeq]]. */
	groupBySeq<K>(toKey: (element: T) => Awaitable<K>): AsyncSeq<[K, T[]]> {
		return AsyncSeq.from(this.groupBy(toKey))
	}

	/** Async [[Seq.buildToString]]. */
	buildToString(this: AsyncSeq<string>, separator?: string): Promise<string> {
		return this.buildTo(new StringBuilder(separator))
	}

	/** Returns "AsyncSeq(...)", since this is a synchronous method. Prefer [[buildToString]]. */
	toString(): string {
		return "AsyncSeq(...)"
	}

	/** Async [[Seq.each]]. */
	async each(action: (input: T) => Awaitable<void>): Promise<void> {
		const iter = this.asyncIterator()
		while (true) {
			const { value, done } = await iter.next()
			if (done)
				break
			else
				await action(value)
		}
	}

	/** Async [[Seq.map]] */
	map<U>(mapper: (input: T) => Awaitable<U>): AsyncSeq<U> {
		return new AsyncSeq<U>(() => {
			const iter = this.asyncIterator()
			return asyncIterator(async () => {
				const { value, done } = await iter.next()
				return done ? iterDone : iterContinue(await mapper(value))
			})
		})
	}

	/** Async [[flatten]]. */
	flatten<T>(this: AnyIterable<Option<AnyIterable<T>>>): AsyncSeq<T> {
		return new AsyncSeq<T>(() => {
			const outerIter = getAsyncIterator(this)
			let innerIterOption: Option<AsyncIterator<T>>
			return asyncIterator(() => exists(innerIterOption) ? innerNext(innerIterOption) : outerNext())

			async function innerNext(innerIter: AsyncIterator<T>): Promise<IteratorResult<T>> {
				const innerIterResult = await innerIter.next()
				if (innerIterResult.done)
					return outerNext()
				else
					return innerIterResult
			}

			async function outerNext(): Promise<IteratorResult<T>> {
				while (true) {
					const { value, done } = await outerIter.next()
					if (done)
						return iterDone
					else if (value !== undefined) {
						innerIterOption = getAsyncIterator(value)
						return innerNext(innerIterOption)
					}
				}
			}
		})
	}

	/** Async [[Seq.flatMap]]. */
	flatMap<U>(mapper: (element: T) => Awaitable<Option<AnyIterable<U>>>): AsyncSeq<U> {
		return this.map(mapper).flatten()
	}

	/** Async [[Seq.concat]]. */
	concat(...concatWith: Array<Option<AnyIterable<T>>>): AsyncSeq<T> {
		return asyncSeq(concatWith).unshift(this).flatten()
	}

	/** Async [[Seq.mapDefined]]. */
	mapDefined<U>(tryGetOutput: (input: T) => Awaitable<Option<U>>): AsyncSeq<U> {
		return new AsyncSeq<U>(() => {
			const iter = this.asyncIterator()
			return asyncIterator(async () => {
				while (true) {
					const { value, done } = await iter.next()
					if (done)
						return iterDone
					else {
						const mappedValue = await tryGetOutput(value)
						if (exists(mappedValue))
							return iterContinue(mappedValue)
					}
				}
			})
		})
	}

	/** Async [[Seq.getDefined]]. */
	getDefined<T>(this: AsyncSeq<Option<T>>): AsyncSeq<T> {
		return this.mapDefined(identity)
	}

	/** Async [[Seq.filter]]. */
	filter(predicate: PredicateAsync<T>): AsyncSeq<T> {
		return new AsyncSeq<T>(() => {
			const iter = this.asyncIterator()
			return asyncIterator(async () => {
				while (true) {
					const { value, done } = await iter.next()
					if (done)
						return iterDone
					else {
						if (await predicate(value))
							return iterContinue(value)
					}
				}
			})
		})
	}

	/** Async [[Seq.reduce]]. */
	async reduce<U>(startAccumulator: U, folder: (accumulator: U, element: T) => Awaitable<U>): Promise<U> {
		let accumulator = startAccumulator
		const iter = this.asyncIterator()
		while (true) {
			const { value, done } = await iter.next()
			if (done)
				return accumulator
			else
				accumulator = await folder(accumulator, value)
		}
	}

	/** Async [[Seq.contains]]. */
	async contains(searchFor: T, equals?: ComparerAsync<T>): Promise<boolean> {
		const iter = this.asyncIterator()
		while (true) {
			const { value, done } = await iter.next()
			if (done)
				return false
			else if (exists(equals) ? equals(value, searchFor) : value === searchFor)
				return true
		}
	}

	/** Async [[Seq.find]]. */
	async find(predicate: PredicateAsync<T>): Promise<Option<T>> {
		const iter = this.asyncIterator()
		while (true) {
			const { value, done } = await iter.next()
			if (done)
				return undefined
			else if (await predicate(value))
				return value
		}
	}

	/** Async [[Seq.isEmpty]]. */
	get isEmpty(): Promise<boolean> {
		return toPromise(this.asyncIterator().next()).then(({ done }) => done)
	}

	/** Async [[Seq.some]]. */
	async some(predicate: PredicateAsync<T>): Promise<boolean> {
		const iter = this.asyncIterator()
		while (true) {
			const { value, done } = await iter.next()
			if (done)
				return false
			else if (predicate(value))
				return true
		}
	}

	/** Async [[Seq.every]]. */
	async every(predicate: PredicateAsync<T>): Promise<boolean> {
		const iter = this.asyncIterator()
		while (true) {
			const { value, done } = await iter.next()
			if (done)
				return true
			else if (!predicate(value))
				return false
		}
	}

	/** Async [[Seq.unshift]]. */
	unshift(value: Awaitable<T>): AsyncSeq<T> {
		return new AsyncSeq(() => {
			let selfIter: Option<AsyncIterator<T>>
			return asyncIterator(async () => {
				if (selfIter !== undefined)
					return await selfIter.next()
				else {
					const result = iterContinue(await value)
					selfIter = this.asyncIterator()
					return result
				}
			})
		})
	}

	/** Async [[Seq.first]]. */
	get first(): Promise<Option<T>> {
		return toPromise(this.asyncIterator().next()).then(({ value, done }) => optional(!done, () => value))
	}

	/** Async [[Seq.tail]]. */
	get tail(): AsyncSeq<T> {
		return this.drop(1)
	}

	/** Async [[Seq.equals]]. */
	async equals(other: AnyIterable<T>, elementEqual?: ComparerAsync<T>): Promise<boolean> {
		const ia = this.asyncIterator()
		const ib = getAsyncIterator(other)
		while (true) {
			const { value: va, done: da } = await ia.next()
			const { value: vb, done: db } = await ib.next()
			if (da || db)
				return da === db
			else if (exists(elementEqual) ? !(await elementEqual(va, vb)) : va !== vb)
				return false
		}
	}

	/** Async [[Seq.take]]. */
	take(numberToTake: Nat): AsyncSeq<T> {
		checkNat(numberToTake)
		return new AsyncSeq(() => {
			const iter = this.asyncIterator()
			let n = numberToTake
			return asyncIterator(async () => {
				if (n <= 0)
					return iterDone
				else {
					n--
					const { value, done } = await iter.next()
					if (done)
						return iterDone
					else
						return iterContinue(value)
				}
			})
		})
	}

	/** Async [[Seq.takeWhile]]. */
	takeWhile(predicate: PredicateAsync<T>): AsyncSeq<T> {
		return new AsyncSeq(() => {
			const iter = this.asyncIterator()
			return asyncIterator(async () => {
				const { value, done } = await iter.next()
				return !done && await predicate(value)
					? iterContinue(value)
					: iterDone
			})
		})
	}

	/** Async [[Seq.drop]]. */
	drop(numberToDrop: Nat): AsyncSeq<T> {
		checkNat(numberToDrop)
		return new AsyncSeq<T>(() => {
			const iter = this.asyncIterator()
			let n = numberToDrop
			return asyncIterator(async () => {
				for (; n > 0; n--) {
					const { done } = await iter.next()
					if (done)
						return iterDone
				}
				return iter.next()
			})
		})
	}

	/** Async [[Seq.dropWhile]]. */
	dropWhile(predicate: PredicateAsync<T>): AsyncSeq<T> {
		return new AsyncSeq(() => {
			const iter = this.asyncIterator()
			let dropped = false
			return asyncIterator(async () => {
				if (dropped)
					return await iter.next()
				else
					while (true) {
						const { value, done } = await iter.next()
						if (done) {
							dropped = true
							return iterDone
						}
						if (!await predicate(value)) {
							dropped = true
							return iterContinue(value)
						}
					}
			})
		})
	}

	/**
	Async [[Seq.zip]].
	It's parallel: The two input iterators' `next` methods are called at the same time.
	*/
	zip<U, V>(other: AnyIterable<U>, zipper: (left: T, right: U) => Awaitable<V>): AsyncSeq<V>
	zip<U>(other: AnyIterable<U>): AsyncSeq<[T, U]>
	zip<U>(other: AnyIterable<U>, zipper?: (left: T, right: U) => any): AsyncSeq<any> {
		return new AsyncSeq(() => {
			const leftIter = this.asyncIterator()
			const rightIter = getAsyncIterator(other)
			return asyncIterator(async () => {
				const [{ value: leftValue, done: leftDone }, { value: rightValue, done: rightDone }] =
					await Promise.all([await leftIter.next(), await rightIter.next()])
				if (leftDone || rightDone)
					return iterDone
				return iterContinue(
					exists(zipper) ? await zipper(leftValue, rightValue) : [leftValue, rightValue])
			})
		})
	}

	/** Async [[Seq.withIndex]]. */
	get withIndex(): AsyncSeq<[T, Nat]> {
		return this.zip<Nat>(Range.nats)
	}

	/** Async [[Seq.union]]. */
	union(other: AnyIterable<T>): AsyncSeq<T> {
		return this.concat(other).unique
	}

	/** Async [[Seq.intersection]]. */
	intersection(other: AnyIterable<T>): AsyncSeq<T> {
		return AsyncSeq.from((async () => {
			const r = await AsyncSeq.from(other).toSet()
			return this.filter(element => r.has(element))
		})())
	}

	/** Async [[Seq.difference]]. */
	difference(other: AnyIterable<T>): AsyncSeq<T> {
		return AsyncSeq.from((async () => {
			const r = await AsyncSeq.from(other).toSet()
			return this.filter(element => !r.has(element))
		})())
	}

	/** Async [[Seq.count]]. */
	count(): Promise<Nat> {
		return this.reduce(0, incr)
	}

	/** Async [[Seq.max]]. */
	max(this: AsyncSeq<number>): Promise<Option<T>>
	max(comparer: (left: T, right: T) => Awaitable<number>): Promise<Option<T>>
	async max(comparer?: (left: T, right: T) => Awaitable<number>): Promise<Option<T>> {
		let max: Option<T>
		await this.each(async element => {
			if (!exists(max) || (exists(comparer) ? await comparer(element, max) > 0 : element > max))
				max = element
		})
		return max
	}

	/** Async [[Seq.min]]. */
	min(this: AsyncSeq<number>): Promise<Option<T>>
	min(comparer: (left: T, right: T) => Awaitable<number>): Promise<Option<T>>
	async min(comparer?: (left: T, right: T) => Awaitable<number>): Promise<Option<T>> {
		let min: Option<T>
		await this.each(async element => {
			if (!exists(min) || (exists(comparer) ? await comparer(element, min) < 0 : element < min))
				min = element
		})
		return min
	}

	/** Async [[Seq.sum]]. */
	sum(this: AsyncSeq<number>): Promise<number> {
		return this.reduce(0, add)
	}
}

/** Shorthand for [[AsyncSeq.from]]. */
export const asyncSeq = AsyncSeq.from

/** Creates an [[AsyncIterator]] from a `next` callback. */
export function asyncIterator<T>(next: () => Promise<IteratorResult<T>>): AsyncIterator<T> {
	return { next }
}
