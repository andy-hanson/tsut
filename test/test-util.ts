/// <reference types="mocha"/>
/// <reference types="node"/>

import { AsyncSeq, Awaitable, Fn1, Fn2, Nat, Option, exists, keepIf, optional, sleep } from "../src"
import * as nodeAssert from "assert"

declare global {
	interface ArrayConstructor {
		from<T>(seq: Iterable<T>): T[]
	}

	interface Function {
		readonly name: string
	}
}

/** Assert a boolean condition. */
export const assert = nodeAssert

/**
Assert deep equality.
Should be eq(actual, expected).
*/
export const eq = assert.deepStrictEqual

/** Assert exact equality. */
export const eqStrict = assert.strictEqual

/** Assert that a function throws. */
export function throws(f: () => any, expected?: Error): void {
	try {
		f()
	} catch (error) {
		if (exists(expected))
			assertError(error, expected)
		return
	}
	throw new Error("Expected function to throw.")
}

/** Assert that an asyncrhronous function returns a rejected Promise. */
export async function throwsAsync(f: () => Promise<{}>, expected?: Error): Promise<void> {
	try {
		await f()
	} catch (error) {
		if (exists(expected))
			assertError(error, expected)
		return
	}
	throw new Error("Expected function to throw.")
}

function assertError(actual: Error, expected: Error): void {
	eq(actual.constructor, expected.constructor)
	eq(actual.message, expected.message)
}

/** Assert the (eventual) value of an [[AsyncSeq]]. */
export async function asyncEq<T>(seq: AsyncSeq<T>, expected: T[]): Promise<void> {
	eq(await seq.toArray(), expected)
}

/** Assert the value of an Iterable by calling `Array.from`. */
export function seqEq<T>(seq: Iterable<T>, expected: T[]): void {
	eq(Array.from(seq), expected)
}

/** Convenient utility for testing a function. */
export function calls<T extends Function>(f: T, body: (f: T) => Awaitable<void>): void {
	it(f.name, () => body(f))
}

/**
Asserts that the time taken by an action is within 10% of `millis`.
This is useful for testing that `sleep` calls are happening.
Sleep time should be much greater than compute time or these tests will fail.
*/
export async function assertTimeTaken(millis: number, action: () => Promise<void>): Promise<void> {
	const start = currentTimeMillis()
	await action()
	const end = currentTimeMillis()
	const timeTaken = end - start
	const epsilon = 0.1
	assert(timeTaken > millis * (1 / (1 + epsilon)),
		`Went to fast; expected to take ${millis}, took ${timeTaken}`)
	assert(timeTaken < millis * (1 + epsilon),
		`Went too slow; expected to take ${millis}, took ${timeTaken}`)
}

function currentTimeMillis(): Nat {
	const [seconds, nanos] = process.hrtime()
	return seconds * 1000 + nanos / 1000000
}

/**
Pause for one step before calling a function.
Use this to create test async functions.
*/
export function sleepAndDo<T>(f: () => T): () => Promise<T>
export function sleepAndDo<T, U>(f: Fn1<T, U>): Fn1<T, Promise<U>>
export function sleepAndDo<T, U, V>(f: Fn2<T, U, V>): Fn2<T, U, Promise<V>>
export function sleepAndDo(f: Function): Function {
	return async (...args: any[]) => {
		await sleep(stepTime)
		return f(...args)
	}
}

const stepTime = 100

/**
Asserts the time in steps taken.
Use with [[sleepAndDo]].
*/
export function assertStepsTaken(steps: number, action: () => Promise<void>): Promise<void> {
	return assertTimeTaken(steps * stepTime, action)
}

/** AsyncSeq of [1, 2, 3]. */
export const asyncNats = AsyncSeq.unfold(0, i => keepIf(i + 1, x => x < 3))

/** Halve a number iff it's even. */
export function tryHalve(x: number): Option<number> {
	return optional(x % 2 === 0, () => x / 2)
}
