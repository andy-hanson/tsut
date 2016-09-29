import { add } from "../src"
import * as u from "../src/builder"
import { eq } from "./test-util"

describe("builder", () => {
	function testBuilder<T, Res>(b: u.Builder<Res, T>, expectedResult: Res, added: T[]): void {
		for (const a of added) {
			b.add(a)
		}
		eq(b.finish(), expectedResult)
	}

	it("ArrayBuilder", () => {
		testBuilder(new u.ArrayBuilder(), [1, 2, 3], [1, 2, 3])
	})

	it("SetBuilder", () => {
		testBuilder(new u.SetBuilder(), Set.of(1, 2, 3), [1, 2, 3])
	})

	it("MapBuilder", () => {
		testBuilder(
			new u.MapBuilder<number, number>(),
			Map.of([1, 2], [3, 4]),
			[[1, 2], [3, 4]])

		testBuilder(
			new u.MapBuilder<number, number>(add),
			Map.of([1, 6]),
			[[1, 2], [1, 4]])
	})

	it("StringBuilder", () => {
		testBuilder(new u.StringBuilder(), "", [])
		testBuilder(new u.StringBuilder(), "abc", ["a", "b", "c"])
		testBuilder(new u.StringBuilder("|"), "a|b|c", ["a", "b", "c"])
	})
})
