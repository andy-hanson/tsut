import * as u from "../src/misc"
import { assert, calls, throws } from "./test-util"

describe("misc", () => {
	calls(u.TODO, f => {
		throws(f, new Error("TODO"))
		throws(() => f("BOO"), new Error("BOO"))
	})

	calls(u.eq, f => {
		assert(f(0)(0))
		assert(!f(0)(1))
	})

	calls(u.ignore, f => { f() })

	calls(u.raise, f => {
		throws(f, new Error())
		throws(() => f(new Error("A")), new Error("A"))
	})
})
