import * as u from "../src/math"
import { assert, calls, eq, throws } from "./test-util"

describe("math", () => {
	calls(u.incr, f => {
		eq(f(0), 1)
	})

	calls(u.decr, f => {
		eq(f(1), 0)
	})

	calls(u.isNat, f => {
		assert(!f(-1))
		assert(f(0))
		assert(!f(0.5))
		assert(f(Number.MAX_SAFE_INTEGER))
	})

	calls(u.checkInt, f => {
		f(-1)
		throws(() => f(Number.MAX_SAFE_INTEGER + 1))
	})

	calls(u.checkNat, f => {
		f(0)
		throws(() => f(-1))
	})

	calls(u.divisible, f => {
		assert(f(4, 2))
		assert(f(-4, 2))
		assert(!f(5, 2))
	})

	calls(u.add, f =>
		eq(f(1, 2), 3))

	calls(u.subtract, f =>
		eq(f(1, 2), -1))

	calls(u.multiply, f =>
		eq(f(1, 2), 2))

	calls(u.divide, f =>
		eq(f(1, 2), 0.5))
})
