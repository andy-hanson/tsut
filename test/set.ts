import { divisible } from "../src"
import * as u from "../src/set"
import { assert, calls, eq, seqEq } from "./test-util"

describe("set", () => {
	calls(u.toSet, f => {
		const s = Set.of(1, 2, 3)
		assert.strictEqual(f(s), s)
		eq(f([1, 2, 3]), s)
	})

	calls(u.unionMutate, f => {
		const a = Set.of(1, 2, 3)
		f(a, [2, 3, 4])
		seqEq(a, [1, 2, 3, 4])
	})

	calls(u.intersectionMutate, f => {
		const a = Set.of(1, 2, 3)
		f(a, [2, 3, 4])
		seqEq(a, [2, 3])
	})

	calls(u.differenceMutate, f => {
		const a = Set.of(1, 2, 3)
		f(a, [2, 3, 4])
		seqEq(a, [1])
	})

	calls(u.union, f => {
		eq(f([1, 2, 3], [2, 3, 4]), Set.of(1, 2, 3, 4))
	})

	calls(u.intersection, f => {
		eq(f([1, 2, 3], [2, 3, 4]), Set.of(2, 3))
	})

	calls(u.difference, f => {
		eq(f([1, 2, 3], [2, 3, 4]), Set.of(1))
	})

	calls(u.filterMutateSet, f => {
		const a = Set.of(1, 2, 3, 4)
		f(a, x => divisible(x, 2))
	})
})
