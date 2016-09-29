import { add, identity, incr } from "../src"
import * as u from "../src/array"
import { assertStepsTaken, calls, eq, seqEq, sleepAndDo, throws, tryHalve } from "./test-util"

describe("array", () => {
	it("empty", () => {
		throws(() => u.empty.push(1 as never))
	})

	calls(u.mapMutate, f => {
		const arr = [1, 2, 3]
		f(arr, incr)
		eq(arr, [2, 3, 4])
	})

	calls(u.filterMutate, f => {
		const arr = [1, -2, 3, -4]
		f(arr, x => x > 0)
		eq(arr, [1, 3])
	})

	calls(u.mapDefinedMutate, f => {
		const arr = [1, 2, 3, 4]
		f(arr, tryHalve)
		eq(arr, [1, 2])
	})

	calls(u.mutate, f => {
		const arr = [0, 1, 2]
		f(arr, 1, incr)
		eq(arr, [0, 2, 2])
	})

	calls(u.removeUnordered, f => {
		const arr = ["a", "b", "c", "d"]
		eq(f(arr, "b"), true)
		eq(f(arr, "e"), false)
		eq(arr, ["a", "d", "c"])

		const arr2 = [{ x: 0 }, { x: 1 }]
		eq(f(arr2, { x: 0 }, (a, b) => a.x === b.x), true)
		eq(arr2, [{ x: 1 }])
	})

	calls(u.zipMutate, f => {
		const arr = [0, 1, 2]
		f(arr, [3, 4, 5], add)
		eq(arr, [3, 5, 7])
		f(arr, [-3], add)
		eq(arr, [0])
	})

	describe("AsyncArrayOps", () => {
		it("map", async () => {
			const arr = [1, 2, 3]
			await assertStepsTaken(3, () =>
				u.asyncArray(arr).map(sleepAndDo(incr)))
			eq(arr, [2, 3, 4])
		})

		it("filter", async () => {
			const arr = [1, -2, 3, -4]
			await assertStepsTaken(4, () =>
				u.asyncArray(arr).filter(sleepAndDo(x => x > 0)))
			eq(arr, [1, 3])
		})

		it("mapDefined", async () => {
			const arr = [1, 2, 3, 4]
			await assertStepsTaken(4, () =>
				u.asyncArray(arr).mapDefined(sleepAndDo(tryHalve)))
			eq(arr, [1, 2])
		})

		it("mutate", async () => {
			const arr = [0, 1, 2]
			await u.asyncArray(arr).mutate(1, sleepAndDo(incr))
			eq(arr, [0, 2, 2])
		})
	})

	describe("ParallelArrayOps", () => {
		it("map", async () => {
			let arr = [1, 2, 3, 4]
			await assertStepsTaken(1, () =>
				u.parallelArray(arr).map(sleepAndDo(incr)))
			eq(arr, [2, 3, 4, 5])

			arr = [1, 2, 3, 4]
			await assertStepsTaken(2, () =>
				u.parallelArray(arr, 2).map(sleepAndDo(incr)))
			eq(arr, [2, 3, 4, 5])
		})

		it("filter", async () => {
			const arr = [1, -2, 3, -4]
			await assertStepsTaken(2, () =>
				u.parallelArray(arr, 2).filter(sleepAndDo(x => x > 0)))
			eq(arr, [1, 3])
		})

		it("mapDefined", async () => {
			const arr = [1, 2, 3, 4]
			await assertStepsTaken(2, () =>
				u.parallelArray(arr, 2).mapDefined(sleepAndDo(tryHalve)))
			eq(arr, [1, 2])
		})
	})

	calls(u.isValidIndex, f => {
		eq(f([], 0), false)
		const arr = new Array(3)
		eq(f(arr, -1), false)
		eq(f(arr, 3), false)
		eq(f(arr, 2), true)
	})

	calls(u.checkIndex, f => {
		throws(() => f([], 0))
	})

	calls(u.swap, f => {
		const arr = ["a", "b", "c"]
		f(arr, 2, 0)
		eq(arr, ["c", "b", "a"])
	})

	calls(u.initArray, f => {
		throws(() => f(-1, () => 0), new RangeError("Invalid array length"))
		eq(f(0, identity), [])
		eq(f(3, identity), [0, 1, 2])
	})

	calls(u.initArrayAsync, async f => {
		eq(await f(3, index => Promise.resolve(index)), [0, 1, 2])
	})

	calls(u.initArrayParallel, async f => {
		await assertStepsTaken(1, async () => {
			eq(await f(3, 3, sleepAndDo<number, number>(identity)), [0, 1, 2])
		})
	})

	calls(u.reverse, f => {
		seqEq(f([0, 1, 2]), [2, 1, 0])
	})

	calls(u.shift, f => {
		eq(f([0, 1, 2]), [0, [1, 2]])
		eq(f([]), undefined)
	})

	calls(u.tail, f => {
		eq(f([]), [])
		eq(f([0, 1, 2]), [1, 2])
	})

	calls(u.isEmpty, f => {
		eq(f([]), true)
		eq(f([0]), false)
	})

	calls(u.rightTail, f => {
		eq(f([]), [])
		eq(f([0, 1, 2]), [0, 1])
	})

	calls(u.pop, f => {
		eq(f([]), undefined)
		eq(f([0, 1, 2]), [[0, 1], 2])
	})

	calls(u.last, f => {
		eq(f([]), undefined)
		eq(f([0, 1, 2]), 2)
	})
})
