import { incr } from "../src"
import * as u from "../src/tuple"
import { calls, eq } from "./test-util"

describe("tuple", () => {
	calls(u._1st, f => {
		eq(f([1, "b"]), 1)
	})

	calls(u._2nd, f => {
		eq(f([1, "b"]), "b")
	})

	calls(u._3rd, f => {
		eq(f([1, "b", true]), true)
	})

	calls(u._4th, f => {
		eq(f([1, "b", true, null]), null)
	})

	calls(u.mod1st, f => {
		eq(f([1, "b"], incr), [2, "b"])
	})

	calls(u.mod2nd, f => {
		eq(f(["a", 2], incr), ["a", 3])
	})

	calls(u.mod3rd, f => {
		eq(f([1, "b", true], b => !b), [1, "b", false])
	})

	calls(u.mod4th, f => {
		eq(f([1, "b", true, 0], incr), [1, "b", true, 1])
	})
})
