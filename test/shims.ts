import { Seq } from "../src"
import { eq } from "./test-util"

describe("shims", () => {
	describe("Set", () => {
		it(".of", () => {
			eq(Set.of(0, 1), new Set([0, 1]))
			eq(Set.from(Seq.of(0, 1)), new Set([0, 1]))
		})
	})

	describe("Map", () => {
		it(".of", () => {
			eq(Map.of([0, 1]), new Map([[0, 1]]))
		})
		it(".from", () => {
			eq(
				Map.from(Seq.of<[number, number]>([0, 1])),
				new Map([[0, 1]]))
		})
	})
})
