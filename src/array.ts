import { Comparer, Predicate } from "./function"
import { Nat, checkNat, isNat } from "./math"
import { Option, exists, iff, optional } from "./option"
import { Seq } from "./seq"

/**
Empty immutable array.
Using this instead of a literal array `[]` to avoid allocating memory.
*/
export const empty: ReadonlyArray<never> = Object.freeze([])

/**
Replace each element with the result of calling `getNewValue`.
If `getNewValue` throws, the inputs will be left in a bad state.
(To mutate each element in place, just use a for-of loop.)
*/
export function mapMutate<T>(inputs: T[], getNewValue: (element: T, index: number) => T): void {
	for (let index = 0; index < inputs.length; index++)
		inputs[index] = getNewValue(inputs[index], index)
}

/**
Delete elements of an array not satisfying `predicate`.
If `predicate` throws, the array will be left in a bad state.
*/
export function filterMutate<T>(inputs: T[], predicate: Predicate<T>): void {
	let writeIndex = 0
	for (const input of inputs)
		if (predicate(input)) {
			inputs[writeIndex] = input
			writeIndex++
		}
	inputs.length = writeIndex
}

/**
Replace elements with the result of [[tryGetOutput]] or delete them if that returns `undefined`.
If [[tryGetOutput] throws, the array will be left in a bad state.
*/
export function mapDefinedMutate<T>(inputs: T[], tryGetOutput: (input: T) => Option<T>): void {
	let writeIndex = 0
	for (const input of inputs) {
		const output = tryGetOutput(input)
		if (output !== undefined) {
			inputs[writeIndex] = output
			writeIndex++
		}
	}
	inputs.length = writeIndex
}

/** Change the value at a single index in an array by applying a function to it. */
export function mutate<T>(inputs: T[], index: Nat, transform: (t: T) => T): void {
	checkIndex(inputs, index)
	inputs[index] = transform(inputs[index])
}

/**
Remove an element from an array and do not preserve the array's order.
Useful for arrays used to represent small sets.
Returns whether the value was successfully removed.
*/
export function removeUnordered<T>(inputs: T[], value: T, equal?: Comparer<T>): boolean {
	for (let i = 0; i < inputs.length; i++)
		if (exists(equal) ? equal(inputs[i], value) : inputs[i] === value) {
			inputs[i] = last(inputs)!
			inputs.length--
			return true
		}
	return false
}

/**
Mutate [[inputs]] by combining them with each in [[other]].
If [[other]] is shorter than [[inputs]], this will reduce [[inputs]] in length.
If [[other]] is longer, the extra entries are ignored.
*/
export function zipMutate<T, U>(inputs: T[], other: Iterable<U>, zipper: (input: T, other: U) => T): void {
	const iter = other[Symbol.iterator]()
	for (let index = 0; index < inputs.length; index++) {
		const { value, done } = iter.next()
		if (done) {
			inputs.length = index
			break
		}
		inputs[index] = zipper(inputs[index], value)
	}
}

/** Provides async utilities for an array. */
export function asyncArray<T>(inputs: T[]): AsyncArrayOps<T> {
	return new AsyncArrayOps(inputs)
}

/**
Wrapper class for utilities that mutate arrays asynchronously.
For non-mutating utilities use [[AsyncSeq]].
*/
export class AsyncArrayOps<T> {
	constructor(private inputs: T[]) {}

	/** Asynchronous [[mapMutate]]. */
	async map(getNewValue: (element: T, index: number) => Promise<T>): Promise<void> {
		const { inputs } = this
		for (let index = 0; index < inputs.length; index++)
			inputs[index] = await getNewValue(inputs[index], index)
	}

	/** Asynchronous [[filterMutate]]. */
	async filter(predicate: (element: T) => Promise<boolean>): Promise<void> {
		const { inputs } = this
		let writeIndex = 0
		for (let readIndex = 0; readIndex < inputs.length; readIndex++)
			if (await predicate(inputs[readIndex])) {
				inputs[writeIndex] = inputs[readIndex]
				writeIndex++
			}
		inputs.length = writeIndex
	}

	/** Asynchronous [[mapDefinedMutate]]. Performs `tryGetOutput` one element at a time. */
	async mapDefined(tryGetOutput: (input: T) => Promise<Option<T>>): Promise<void> {
		const { inputs } = this
		let writeIndex = 0
		for (let readIndex = 0; readIndex < inputs.length; readIndex++) {
			const output = await tryGetOutput(inputs[readIndex])
			if (output !== undefined) {
				inputs[writeIndex] = output
				writeIndex++
			}
		}
		inputs.length = writeIndex
	}

	/** Asynchronous [[mutate]]. */
	async mutate(index: Nat, transform: (t: T) => Promise<T>): Promise<void> {
		const { inputs } = this
		checkIndex(inputs, index)
		inputs[index] = await transform(inputs[index])
	}
}

/** Provides parallel utilities for an array. */
export function parallelArray<T>(inputs: T[], maxNumberOfThreads?: number): ParallelArrayOps<T> {
	return new ParallelArrayOps(inputs, maxNumberOfThreads)
}

/**
Wrapper class for utilities that mutate arrays in parallel.
For non-mutating utilities use [[ParallelSeq]].
*/
export class ParallelArrayOps<T> {
	/** Use [[parallelArray]] rather than calling this directly. */
	constructor(readonly inputs: T[], readonly maxNumberOfThreads: number = Number.POSITIVE_INFINITY) {
		if (maxNumberOfThreads !== Number.POSITIVE_INFINITY)
			checkNat(maxNumberOfThreads)
	}

	/** Parallel [[mapMutate]]. */
	async map(mapper: (element: T, index: number) => Promise<T>): Promise<void> {
		const { inputs, maxNumberOfThreads } = this

		let writeIndex = 0
		let readIndex = 0

		while (readIndex < maxNumberOfThreads && readIndex < inputs.length)
			startOne()
		while (readIndex < inputs.length) {
			await awaitOne()
			startOne()
		}
		while (writeIndex < inputs.length)
			await awaitOne()

		async function awaitOne(): Promise<void> {
			inputs[writeIndex] = await (inputs as any as Array<Promise<T>>)[writeIndex]
			writeIndex++
		}
		function startOne(): void {
			(inputs as any as Array<Promise<T>>)[readIndex] = mapper(inputs[readIndex], readIndex)
			readIndex++
		}
	}

	/** Parallel [[filterMutate]]. */
	filter(predicate: (element: T, index: number) => Promise<boolean>): Promise<void> {
		return this.mapDefined(async (input, index) =>
			optional(await predicate(input, index), () => input))
	}

	/** Parallel [[mapDefinedMutate]]. */
	async mapDefined(tryGetOutput: (input: T, index: number) => Promise<Option<T>>): Promise<void> {
		const { inputs, maxNumberOfThreads } = this
		/** Next index to write a (defined) result to. */
		let writeOutputIndex = 0
		/** Next index to await a thread at. */
		let readPromiseIndex = 0
		/** Next index to read an input value from; the thread for that input will be written to the same index. */
		let readValueIndex = 0

		// Start initial threads.
		while (readValueIndex < maxNumberOfThreads && readValueIndex < inputs.length)
			startOne()
		// Keep awaiting threads and starting new ones.
		// Invariants: writeIndex <= readPromiseIndex, readPromiseIndex = readValueIndex - numberOfThreads
		while (readValueIndex < inputs.length) {
			await awaitOne()
			startOne()
		}
		// Await remaining threads.
		while (readPromiseIndex < inputs.length)
			await awaitOne()
		// Shorten array to new length.
		inputs.length = writeOutputIndex

		async function awaitOne(): Promise<void> {
			const output = await (inputs as any as Array<Promise<Option<T>>>)[readPromiseIndex]
			readPromiseIndex++
			if (output !== undefined) {
				inputs[writeOutputIndex] = output
				writeOutputIndex++
			}
		}

		function startOne(): void {
			(inputs as any as Array<Promise<Option<T>>>)[readValueIndex] = tryGetOutput(inputs[readValueIndex], readValueIndex)
			readValueIndex++
		}
	}
}

/**
Whether a number is an integer between 0 and array.length.
Does *not* check for whether there is a "hole" at the index.
*/
export function isValidIndex(inputs: Array<{}>, index: Nat): boolean {
	return isNat(index) && index < inputs.length
}

/** Throws an error if [[index]] is not a valid index. */
export function checkIndex(inputs: Array<{}>, index: Nat): void {
	if (!isValidIndex(inputs, index))
		throw new Error(`Expected an array index < ${inputs.length}, got ${index}`)
}

/** Swap two values in an array. */
export function swap(inputs: Array<{}>, firstIndex: Nat, secondIndex: Nat): void {
	checkIndex(inputs, firstIndex)
	checkIndex(inputs, secondIndex)
	const tmp = inputs[firstIndex]
	inputs[firstIndex] = inputs[secondIndex]
	inputs[secondIndex] = tmp
}

/** Initialize a new array by calling [[makeElement]] [[length]] times. */
export function initArray<T>(length: number, makeElement: (index: number) => T): T[] {
	const arr = new Array(length)
	for (let i = 0; i < length; i++)
		arr[i] = makeElement(i)
	return arr
}

/** Asynchronous [[initArray]]. */
export function initArrayAsync<T>(length: number, makeElement: (index: number) => Promise<T>): Promise<T[]> {
	return Promise.all(initArray(length, makeElement))
}

/** Parallel [[initArray]]. */
export async function initArrayParallel<T>(numberOfThreads: number, length: number, makeElement: (index: number) => Promise<T>): Promise<T[]> {
	const array = new Array(length)
	await parallelArray(array, numberOfThreads).map((_, index) => makeElement(index))
	return array
}

/**
[[Seq]] iterating over an array in reverse.
O(1) to create.
*/
export function reverse<T>(array: T[]): Seq<T> {
	return new Seq(function*(): Iterator<T> {
		for (let i = array.length - 1; i >= 0; i--)
			yield array[i]
	})
}

/** Immutable `Array.prototype.shift`. */
export function shift<T>(array: T[]): Option<[T, T[]]> {
	return optional<[T, T[]]>(!isEmpty(array), () =>
		[array[0], array.slice(1)])
}

/**
Every item but the first.
Identity for empty arrays.
*/
export function tail<T>(array: T[]): T[] {
	return array.slice(1)
}

/** True iff an array has 0 length. */
export function isEmpty(array: any[]): boolean {
	return array.length === 0
}

/**
Every item but the last.
Identity for empty arrays.
*/
export function rightTail<T>(array: T[]): T[] {
	return array.slice(0, array.length - 1)
}

/** Immutable `Array.prototype.pop`. */
export function pop<T>(array: T[]): Option<[T[], T]> {
	return iff<T, [T[], T]>(last(array), popped =>
		[rightTail(array), popped])
}

/** Last element in the array. */
export function last<T>(array: T[]): Option<T> {
	return array[array.length - 1]
}
