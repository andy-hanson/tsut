import { divisible, incr } from "../src"
import * as u from "../src/option"
import { assert, calls, eq, throws } from "./test-util"

describe("option", () => {
	calls(u.optionify, f => {
		eq(f(0), 0)
		eq(f(null), undefined)
		eq(f(undefined), undefined)
	})

	calls(u.exists, f => {
		assert(f(null))
		assert(!f(undefined))
	})

	calls(u.optional, f => {
		eq(f(true, () => 0), 0)
		eq(f(false, () => 0), undefined)
	})

	calls(u.keepIf, f => {
		const isEven = (x: number) => divisible(x, 2)
		eq(f(0, isEven), 0)
		eq(f(1, isEven), undefined)
	})

	calls(u.orThrow, f => {
		eq(f(0, () => new Error()), 0)
		throws(() => f(undefined, () => new Error("boo")), new Error("boo"))
	})

	calls(u.iff, f => {
		eq(f(0, incr), 1)
		eq(f(undefined, incr), undefined)
	})

	calls(u.or, f => {
		eq(f<number>(0, () => 1), 0)
		eq(f<number>(undefined, () => 1), 1)
		eq(f<number>(0, () => true ? 1 : undefined), 0)
		eq(f<number>(undefined, () => true ? 1 : undefined), 1)
	})

	calls(u.and, f => {
		function plus(x: number, y: number): number { return x + y }
		eq(f(0, 1, plus), 1)
		eq(f(undefined, 1, plus), undefined)
		eq(f(0, undefined, plus), undefined)
		eq(f(undefined, undefined, plus), undefined)
	})

	calls(u.equalOptions, f => {
		const absEq = (a: number, b: number) => Math.abs(a) === Math.abs(b)
		assert(f(undefined, undefined, absEq))
		assert(!f(undefined, 0, absEq))
		assert(!f(0, undefined, absEq))
		assert(f(-1, 1, absEq))
		assert(!f(-1, 2, absEq))
	})
})
