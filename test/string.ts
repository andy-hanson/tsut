import * as u from "../src/string"
import { calls, eq, throws } from "./test-util"

describe("string", () => {
	calls(u.padStart, f => {
		eq(f("abc", 1), "abc")
		eq(f("abc", 10), "       abc")
		eq(f("abc", 10, "foo"), "foofoofabc")
		eq(f("abc", 10, "foo"), "foofoofabc")
		eq(f("abc", 6, "123456"), "123abc")
	})

	calls(u.padEnd, f => {
		eq(f("abc", 1), "abc")
		eq(f("abc", 10), "abc       ")
		eq(f("abc", 10, "foo"), "abcfoofoof")
		eq(f("abc", 6, "123456"), "abc123")
	})

	calls(u.stripStart, f => {
		eq(f("abc", "abc123"), "123")
		throws(() => f("def", "abc123"))
	})

	calls(u.stripEnd, f => {
		eq(f("abc123", "123"), "abc")
		throws(() => f("abc123", "456"))
	})
})
