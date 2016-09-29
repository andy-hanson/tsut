import { incr } from "../src"
import * as u from "../src/function"
import { assert, calls, eq } from "./test-util"

const double = (x: number) => x * 2
const all = (...args: number[]) => args

describe("function", () => {
	calls(u.identity, f => {
		eq(f(0), 0)
	})

	calls(u.compose, f => {
		eq(f(incr, double)(0), 2)
		eq(f(double, incr)(0), 1)
	})

	calls(u.partial, f => {
		eq(f(all, 1)(2), [1, 2])
		eq(f(all, 1, 2)(3), [1, 2, 3])
	})

	calls(u.rpartial, f => {
		eq(f(all, 2)(1), [1, 2])
		eq(f(all, 2, 3)(1), [1, 2, 3])
	})

	calls(u.doTimes, f => {
		let x = 0
		f(10, () => { x++ })
		eq(x, 10)
	})

	calls(u.returning, f => {
		let x = false
		eq(0, f(0, z => {
			eq(z, 0)
			x = true
		}))
		assert(x)
	})

	calls(u.thunk, f => {
		eq(f(0)(), 0)
	})

	calls(u.lazy, f => {
		let count = 0
		let m = f(() => {
			count++
			return true
		})
		assert(m())
		eq(count, 1)
		assert(m())
		eq(count, 1)
	})

	calls(u.pipe, f => {
		eq(f(0, incr, double), 2)
	})

	calls(u.before, f => {
		let x = false
		function fn(n: number): number {
			assert(x)
			return n + 1
		}
		eq(f(fn, () => { x = true })(0), 1)
	})

	calls(u.after, f => {
		let x = 0
		function fn(n: number): number {
			assert(!x)
			return n + 1
		}
		eq(f(fn, res => { x = res + 1 })(0), 1)
		eq(x, 2)
	})

	calls(u.memoize, f => {
		let count = 0
		const m = f(({ x, y }: { x: number, y: number }) => {
			count++
			return x + y
		})
		const xy = { x: 1, y: 2 }
		eq(m(xy), 3)
		eq(count, 1)
		eq(m(xy), 3)
		eq(count, 1)
	})

	calls(u.memoize2, f => {
		let count = 0
		const m = f(({ x }: { x: number }, { y }: { y: number}) => {
			count++
			return x + y
		})
		const x = { x: 1 }
		const y = { y: 2 }
		eq(m(x, y), 3)
		eq(count, 1)
		eq(m(x, y), 3)
		eq(count, 1)
	})
})
