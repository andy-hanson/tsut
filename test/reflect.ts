import * as u from "../src/reflect"
import { assert, calls, eq, throws } from "./test-util"

describe("reflect", () => {
	calls(u.revocable, f => {
		const arr: number[] = []
		const { proxy: push, revoke } = f((x: number) => arr.push(x))
		push(0)
		eq(arr, [0])
		revoke()
		throws(() => push(1))
		eq(arr, [0])
	})

	calls(u.using, f => {
		const arr: number[] = []
		const push = f(arr, a => {
			a.push(0)
			// Try to escape the scope
			return () => { a.push(1) }
		})
		eq(arr, [0])
		throws(push)
		eq(arr, [0])
	})

	calls(u.disposing, f => {
		const arr: number[] = []
		const obj = {
			push(n: number): void {
				arr.push(n)
			},
			dispose(): void {
				arr.push(1)
			}
		}
		const push = f(obj, x => {
			x.push(0)
			// Try to escape the scope
			return () => { x.push(1) }
		})
		eq(arr, [0, 1])
		throws(push)
		eq(arr, [0, 1])
	})

	calls(u.picker, f => {
		const makeX = f<{ x: number }>(["x"])
		const xy = { x: 1, y: 2 }
		const justX = makeX(xy)

		assert("x" in justX)
		assert(!("y" in justX))

		eq(justX.x, 1)
		throws(() => (justX as any).y, new TypeError('Can only read from one of: "x"'))
	})

	calls(u.readonly, f => {
		const p = f({ x: 1 })
		eq(p.x, 1)
		throws(() => { p.x = 2 })
		eq(p.x, 1)
	})
})
