import { Nullable } from "../src"
import * as u from "../src/async"
import { assert, assertTimeTaken, calls, eq, throwsAsync } from "./test-util"

describe("async", () => {
	function halveCallback(n: number, cb: (err: Nullable<Error>, result: Nullable<number>) => void): void {
		if (n % 2 === 0)
			cb(null, n / 2)
		else
			cb(new Error(), null)
	}

	calls(u.callback, async f => {
		eq(await f(cb => halveCallback(2, cb)), 1)
		await throwsAsync(() => f(cb => halveCallback(3, cb)))
	})

	calls(u.promisify, async f => {
		const halve = f(halveCallback)
		eq(await halve(2), 1)
		await throwsAsync(() => halve(3))
	})

	calls(u.toPromise, async f => {
		const p = f(1)
		assert(p instanceof Promise)
		assert(f(p) === p)
	})

	calls(u.sleep, f =>
		assertTimeTaken(100, () => f(100)))

	calls(u.deferred, async f => {
		const [{ resolve }, promise] = f<number>()
		resolve(0)
		eq(await promise, 0)
		const [{ reject }, promise2] = f<number>()
		reject(new Error("Rejected"))
		await throwsAsync(() => promise2, new Error("Rejected"))
	})
})
