import { Range, range } from "../src/range"
import { assert, calls, eq, seqEq, throws } from "./test-util"

describe("range", () => {
	const to3 = range(0, 3)
	const to0 = range(3, 0)

	calls(range, f => {
		throws(() => f(0, 3, -1))
		throws(() => f(3, 0, 1))
	})

	describe("Range", () => {
		it("nats", () => {
			seqEq(Range.nats.seq.take(3), [0, 1, 2])
		})
	})

	it("iterator", () => {
		seqEq(to3, [0, 1, 2])
		seqEq(to0, [3, 2, 1])
	})

	it("reverse", () => {
		eq(to3.reverse, to0)
		eq(to0.reverse, to3)
	})

	it("span", () => {
		eq(to3.span, 3)
		eq(to0.span, 3)
	})

	it("spanContains", () => {
		assert(to3.spanContains(0))
		assert(to3.spanContains(3))

		assert(to0.spanContains(3))
		assert(to0.spanContains(0))
	})

	it("clamp", () => {
		eq(to3.clamp(-1), 0)
		eq(to3.clamp(1.5), 1.5)
		eq(to3.clamp(5), 3)

		eq(to0.clamp(-1), 0)
		eq(to0.clamp(1.5), 1.5)
		eq(to3.clamp(5), 3)
	})
})
