import { Builder, Seq, add, iterContinue, iterDone, iterableOfIterator, optional, raise } from "../src"
import { AsyncIterable, AsyncSeq, asyncIterator, getAsyncIterator } from "../src/asyncSeq"
import { assert, asyncEq, asyncNats, eq, seqEq, sleepAndDo, throws, throwsAsync, tryHalve } from "./test-util"

describe("asyncSeq", () => {
	it("getAsyncIterator", async () => {
		const alreadyAsyncIter = asyncIterator(() => Promise.resolve({ value: 0, done: true }))
		eq(getAsyncIterator({ asyncIterator: () =>  alreadyAsyncIter }),  alreadyAsyncIter)

		// Strings handled specially
		eq(await getAsyncIterator("abc").next(), { value: "a", done: false })

		const iter: Iterator<number> = {
			next: iterContinue,
			return: iterContinue,
			throw: iterContinue
		}
		const iterAsAsync = getAsyncIterator(iterableOfIterator(iter))
		eq(await iterAsAsync.next(0), iterContinue(0))
		eq(await iterAsAsync.return!(1), iterContinue(1))
		eq(await iterAsAsync.throw!(2), iterContinue(2))
	})

	describe("AsyncSeq", () => {
		it("empty", () =>
			asyncEq(AsyncSeq.empty, []))

		it("from", async () => {
			await asyncEq(AsyncSeq.from([0, 1, 2]), [0, 1, 2])

			const a: AsyncIterable<number> = {
				asyncIterator: () => {
					let n = 3
					return asyncIterator(sleepAndDo(() =>
						n > 0 ? iterContinue(n--) : iterDone))
				}
			}
			await asyncEq(AsyncSeq.from(a), [3, 2, 1])

			await asyncEq(
				AsyncSeq.from<number>(sleepAndDo(() => a)()),
				[3, 2, 1])
		})

		it("of", () =>
			asyncEq(AsyncSeq.of("a", "b"), ["a", "b"]))

		it("unfold", () =>
			asyncEq(
				AsyncSeq.unfold(3, sleepAndDo<number, number | undefined>(n =>
					n > 0 ? n - 1 : undefined)),
				[3, 2, 1, 0]))

		describe("fromPush", () => {
			it("plain / queued", async () => {
				const s = AsyncSeq.fromPush(({ push, finish }) => {
					// Since we eagerly push, these become queued before being read.
					push(0)
					push(1)
					finish()
				})

				await asyncEq(s, [0, 1])
				// Can iterate multiple times
				await asyncEq(s, [0, 1])
			})

			it("error", async () => {
				const s = AsyncSeq.fromPush(({ push, error }) => {
					push(0)
					error(new Error("errored"))
				})
				// Error doesn't throw if you don't reach it
				await asyncEq(s.take(1), [0])
				await throwsAsync(() => s.eager())
			})

			it("bad pusher", async () => {
				const s = AsyncSeq.fromPush(({ push, finish }) => {
					push(0)
					finish()
					push(1)
				})
				await throwsAsync(() => s.eager())
			})

			it("deferred", async () => {
				// Test for what happens if the sequence is used before values are pushed.

				let push: ((n: number) => void) | undefined
				let finish: (() => void) | undefined
				const s = AsyncSeq.fromPush<number>(({ push: p, finish: f }) => {
					push = p
					finish = f
				})
				const iter = s.asyncIterator()
				const [promise0, promise1, promise2, promise3] = [iter.next(), iter.next(), iter.next(), iter.next()]
				push!(0)
				eq(await promise0, { value: 0, done: false })
				push!(1)
				eq(await promise1, { value: 1, done: false })
				finish!()
				eq(await promise2, { value: undefined, done: true })
				eq(await promise3, { value: undefined, done: true })
			})
		})
	})

	it("eager", async () =>
		seqEq(await asyncNats.eager(), [0, 1, 2]))

	it("memoize", async () => {
		let timesYieldedA = 0
		let timesYieldedB = 0
		const s = new AsyncSeq(() => {
			let lastYielded: "a" | "b" | undefined
			return asyncIterator(sleepAndDo<IteratorResult<string>>(() => {
				switch (lastYielded) {
					case undefined:
						timesYieldedA++
						return iterContinue(lastYielded = "a")
					case "a":
						timesYieldedB++
						return iterContinue(lastYielded = "b")
					default:
						return iterDone
				}
			}))
		}).memoize

		const iterA = s.asyncIterator()
		const iterB = s.asyncIterator()
		eq([timesYieldedA, timesYieldedB], [0, 0])

		eq(await iterA.next(), iterContinue("a"))
		eq([timesYieldedA, timesYieldedB], [1, 0])

		eq(await iterB.next(), iterContinue("a"))
		eq([timesYieldedA, timesYieldedB], [1, 0])

		eq(await iterB.next(), iterContinue("b"))
		eq([timesYieldedA, timesYieldedB], [1, 1])

		eq(await iterA.next(), iterContinue("b"))
		eq([timesYieldedA, timesYieldedB], [1, 1])

		eq(await iterA.next(), iterDone)
		eq(await iterB.next(), iterDone)
		eq([timesYieldedA, timesYieldedB], [1, 1])
	})

	it("buildTo", async () => {
		const arr: number[] = []
		const myBuilder: Builder<number[], number> = {
			add(x): void { arr.unshift(x) },
			finish: () => arr
		}
		eq(await asyncNats.buildTo(myBuilder), [2, 1, 0])
	})

	it("toArray", async () => {
		eq(await asyncNats.toArray(), [0, 1, 2])
	})

	it("toSet", async () => {
		eq(await asyncNats.toSet(), Set.of(0, 1, 2))
	})

	it("unique", () =>
		asyncEq(Seq.of(0, 1, 2, 0, 1, 3).async.unique, [0, 1, 2, 3]))

	it("toMap", async () => {
		eq(
			await Seq.of<[number, string]>([1, "a"], [2, "b"]).async.toMap(),
			Map.of([1, "a"], [2, "b"]))
		eq(
			await Seq.of<[number, string]>([1, "a"], [1, "A"]).async.toMap<number, string>(add),
			Map.of([1, "aA"]))
	})

	it("groupBy & groupBySeq", async () => {
		const s = AsyncSeq.of("ab", "ac", "bb")
		const out: [string, string[]][] = [["a", ["ab", "ac"]], ["b", ["bb"]]]
		eq(await s.groupBy(str => str[0]), Map.from(out))
		await asyncEq(s.groupBySeq(str => str[0]), out)
	})

	it("buildToString", async () => {
		eq(await asyncNats.map(String).buildToString("|"), "0|1|2")
	})

	it("toString", () => {
		eq(asyncNats.toString(), "AsyncSeq(...)")
	})

	it("each", async () => {
		const x: number[] = []
		await asyncNats.each(sleepAndDo<number, void>(n => { x.push(n) }))
		eq(x, [0, 1, 2])
	})

	it("map", () =>
		asyncEq(asyncNats.map(sleepAndDo((x: number) => x + 1)), [1, 2, 3]))

	it("flatten", () =>
		asyncEq(
			AsyncSeq.from([asyncNats, asyncNats]).flatten(),
			[0, 1, 2, 0, 1, 2]))

	it("flatMap", () =>
		asyncEq(asyncNats.flatMap(sleepAndDo(x => optional(x !== 1, () => [x, x]))), [0, 0, 2, 2]))

	it("concat", () =>
		asyncEq(asyncNats.concat(undefined, asyncNats), [0, 1, 2, 0, 1, 2]))

	it("mapDefined", () =>
		asyncEq(asyncNats.mapDefined(sleepAndDo(tryHalve)), [0, 1]))

	it("getDefined", () =>
		asyncEq(AsyncSeq.of(0, undefined, 1).getDefined(), [0, 1]))

	it("filter", () =>
		asyncEq(asyncNats.filter(x => x !== 1), [0, 2]))

	it("reduce", async () => {
		eq(await asyncNats.reduce("", (s, n) => s + n), "012")
	})

	it("contains", async () => {
		assert(await asyncNats.contains(0))
		assert(!await asyncNats.contains(3))
		assert(await asyncNats.contains(3, (x, y) => x + y === 5))
		assert(!await asyncNats.contains(3, (x, y) => x + y === 6))
	})

	it("find", async () => {
		eq(await asyncNats.find(x => x + x === 2), 1)
		eq(await asyncNats.find(x => x > 2), undefined)
	})

	it("isEmpty", async () => {
		assert(await AsyncSeq.empty.isEmpty)
		assert(!await asyncNats.isEmpty)
	})

	it("some", async () => {
		assert(!await AsyncSeq.empty.some(raise))
		assert(await asyncNats.some(x => x === 2))
	})

	it("every", async () => {
		assert(await AsyncSeq.empty.every(raise))
		assert(await asyncNats.every(x => x < 3))
		assert(!await asyncNats.every(x => x < 2))
	})

	it("unshift", () =>
		asyncEq(asyncNats.unshift(-1), [-1, 0, 1, 2]))

	it("first", async () => {
		eq(await asyncNats.first, 0)
		eq(await AsyncSeq.empty.first, undefined)
	})

	it("tail", async () => {
		await asyncEq(asyncNats.tail, [1, 2])
		await asyncEq(AsyncSeq.empty.tail, [])
	})

	it("equals", async () => {
		assert(await asyncNats.equals([0, 1, 2]))
		assert(!await asyncNats.equals([0, 1]))
		assert(await asyncNats.equals([10, 11, 12], sleepAndDo((a, b) => a % 10 === b % 10)))
		assert(!await asyncNats.equals([10, 11, 13], sleepAndDo((a, b) => a % 10 === b % 10)))
	})

	it("take", async () => {
		await asyncEq(asyncNats.take(4), [0, 1, 2])
		await asyncEq(asyncNats.take(2), [0, 1])
		await asyncEq(asyncNats.take(0), [])
		throws(() => asyncNats.take(-1))
	})

	it("takeWhile", async () => {
		await asyncEq(asyncNats.takeWhile(x => x < 2), [0, 1])
		await asyncEq(asyncNats.takeWhile(() => false), [])
		await asyncEq(asyncNats.takeWhile(() => true), [0, 1, 2])
	})

	it("drop", async () => {
		await asyncEq(asyncNats.drop(4), [])
		await asyncEq(asyncNats.drop(2), [2])
		await asyncEq(asyncNats.drop(0), [0, 1, 2])
		throws(() => asyncNats.drop(-1))
	})

	it("dropWhile", async () => {
		await asyncEq(asyncNats.dropWhile(x => x < 2), [2])
		await asyncEq(asyncNats.dropWhile(() => false), [0, 1, 2])
		await asyncEq(asyncNats.dropWhile(() => true), [])
	})

	it("zip", async () => {
		await asyncEq(asyncNats.zip([]), [])
		await asyncEq(asyncNats.zip(["a", "b", "c", "d"]), [[0, "a"], [1, "b"], [2, "c"]])
		await asyncEq(asyncNats.zip([3, 4, 5], add), [3, 5, 7])
	})

	it("withIndex", () =>
		asyncEq(asyncNats.withIndex, [[0, 0], [1, 1], [2, 2]]))

	it("union", async () => {
		await asyncEq(asyncNats.union([1, 2, 3]), [0, 1, 2, 3])
		await asyncEq(asyncNats.union([]), [0, 1, 2])
	})

	it("intersection", async () => {
		await asyncEq(asyncNats.intersection([1, 2, 3]), [1, 2])
		await asyncEq(asyncNats.intersection([]), [])
	})

	it("difference", async () => {
		await asyncEq(asyncNats.difference([1, 3]), [0, 2])
		await asyncEq(asyncNats.difference([]), [0, 1, 2])
	})

	it("count", async () => {
		eq(await asyncNats.count(), 3)
	})

	it("max", async () => {
		eq(await AsyncSeq.empty.max(), undefined)
		eq(await asyncNats.max(), 2)
		eq(await asyncNats.max(sleepAndDo((a: number, b: number) => b - a)), 0)
	})

	it("min", async () => {
		eq(await AsyncSeq.empty.min(), undefined)
		eq(await asyncNats.min(), 0)
		eq(await asyncNats.min(sleepAndDo((a: number, b: number) => b - a)), 2)
	})

	it("sum", async () => {
		eq(await asyncNats.sum(), 3)
	})
})
