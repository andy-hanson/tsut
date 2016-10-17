import { AsyncSeq, ignore, incr, range } from "../src"
import { assertStepsTaken, asyncEq, asyncNats, eq, sleepAndDo, throws, tryHalve } from "./test-util"

describe("ParallelOperations", () => {
	it("nThreads", async () => {
		const six = range(0, 6).seq.par
		throws(() => six.nThreads(0))
		await assertStepsTaken(3, async () =>
			six.nThreads(2).each(sleepAndDo(ignore)))
		await assertStepsTaken(2, async () =>
			six.nThreads(3).each(sleepAndDo(ignore)))
		await assertStepsTaken(1, async () =>
			six.nThreads(6).each(sleepAndDo(ignore)))
	})

	it("each", () =>
		assertStepsTaken(1, async () => {
			const arr: number[] = []
			await asyncNats.par.each(sleepAndDo((x: number) => { arr.push(x) }))
			eq(arr, [0, 1, 2])
		}))

	it("map", async () => {
		await asyncEq(AsyncSeq.empty.par.map(sleepAndDo(incr)), [])
		await assertStepsTaken(1, () =>
			asyncEq(
				asyncNats.par.map(sleepAndDo(incr)),
				[1, 2, 3]))
	})

	it("flatMap", () =>
		// Takes 10 steps: 1 to get started, then 3 for each triple.
		// The function passed to `flatMap` is run in parallel, but its outputs run serially.
		assertStepsTaken(10, () =>
			asyncEq(
				asyncNats.par.flatMap(sleepAndDo((x: number) =>
					asyncNats.map(sleepAndDo((n: number) => x * 10 + n)))),
				[0, 1, 2, 10, 11, 12, 20, 21, 22])))

	it("mapDefined", () =>
		assertStepsTaken(1, () =>
			asyncEq(
				asyncNats.par.mapDefined(sleepAndDo(tryHalve)),
				[0, 1])))

	it("filter", () =>
		assertStepsTaken(1, () =>
			asyncEq(
				asyncNats.par.filter(sleepAndDo((x: number) => x !== 1)),
				[0, 2])))
})
