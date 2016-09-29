import { add, divisible, keepIf } from "../src"
import * as u from "../src/map"
import { calls, seqEq } from "./test-util"

describe("map", () => {
	calls(u.mutateMapValues, f => {
		const m = Map.of([1, 2], [3, 4])
		f(m, add)
		seqEq(m, [[1, 3], [3, 7]])
	})

	calls(u.mutateMapValuesDefined, f => {
		const m = Map.of([1, 2], [3, 5])
		f(m, (k, v) => keepIf(k + v, x => divisible(x, 2)))
		seqEq(m, [[3, 8]])
	})

	calls(u.filterMutateMap, f => {
		const m = Map.of([1, 2], [3, 2])
		f(m, (k, v) => k < v)
		seqEq(m, [[1, 2]])
	})

	calls(u.mapUnionMutate, f => {
		const m = Map.of([1, 2])
		f(m, [[3, 4]])
		seqEq(m, [[1, 2], [3, 4]])

		f(m, [[1, -2], [3, -4]], add)
		seqEq(m, [[1, 0], [3, 0]])
	})

	calls(u.multiMapAdd, f => {
		const m = new Map<number, number[]>()
		f(m, 0, 1)
		seqEq(m, [[0, [1]]])
		f(m, 0, 2)
		seqEq(m, [[0, [1, 2]]])
	})

	calls(u.multiMapRemove, f => {
		const m = Map.of([0, [1, 2]])
		f(m, 0, 1)
		seqEq(m, [[0, [2]]])
		f(m, 0, 2)
		seqEq(m, [])
	})
})
