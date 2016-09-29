import * as u from "../src/types"
import { assert, calls } from "./test-util"

describe("types", () => {
	calls(u.isBoolean, f => {
		assert(f(true))
		assert(!f(new Boolean()))
	})

	calls(u.isNumber, f => {
		assert(f(0))
		assert(!f(new Number()))
	})

	calls(u.isString, f => {
		assert(f(""))
		assert(!f(new String()))
	})

	calls(u.isSymbol, f => {
		assert(f(Symbol.iterator))
		assert(!f(""))
	})

	calls(u.isFunction, f => {
		assert(f(f))
		assert(f(new Function()))
		assert(!f(0))
	})

	calls(u.isObject, f => {
		assert(f({}))
		assert(!f(0))
		assert(!f(new Function()))
		assert(!f(undefined))
		assert(!f(null))
	})
})
