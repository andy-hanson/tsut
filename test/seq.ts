import { Builder, add, incr, optional, raise } from "../src"
import { iterableOfIterator, iterContinue, iterDone, Seq, seq } from "../src/seq"
import { assert, eq, eqStrict, seqEq, throws, tryHalve } from "./test-util"

const nats = Seq.of(0, 1, 2)

describe("seq", () => {
	describe("Seq", () => {
		it("empty", () => {
			seqEq(Seq.empty, [])
		})

		it("from", () => {
			seqEq(Seq.from([0, 1, 2]), [0, 1, 2])
		})

		it("of", () => {
			seqEq(Seq.of(0, 1, 2), [0, 1, 2])
		})

		it("single", () => {
			seqEq(Seq.of(0), [0])
		})

		it("repeat", () => {
			seqEq(Seq.repeat(0).take(3), [0, 0, 0])
		})

		it("cycle", () => {
			seqEq(Seq.cycle([0, 1, 2]).take(7), [0, 1, 2, 0, 1, 2, 0])
		})

		it("unfold", () => {
			seqEq(Seq.unfold(1, x => optional(x < 100, () => x * 3)), [1, 3, 9, 27, 81, 243])
		})

		it("ofOption", () => {
			seqEq(Seq.ofOption(undefined), [])
			seqEq(Seq.ofOption(0), [0])
		})
	})

	it("eager", () => {
		let timesComputed = 0
		const s = new Seq(function*(): Iterator<number> {
			timesComputed++
			yield 0
		}).eager()
		eq(timesComputed, 1)
		seqEq(s, [0])
		eq(timesComputed, 1)
	})

	//todo: similar for async
	it("memoize", () => {
		let timesYieldedA = 0
		let timesYieldedB = 0
		const s = new Seq(function*(): Iterator<string> {
			timesYieldedA++
			yield "a"
			timesYieldedB++
			yield "b"
		}).memoize

		const iterA = s[Symbol.iterator]()
		const iterB = s[Symbol.iterator]()
		eq([timesYieldedA, timesYieldedB], [0, 0])

		eq(iterA.next(), iterContinue("a"))
		eq([timesYieldedA, timesYieldedB], [1, 0])

		eq(iterB.next(), iterContinue("a"))
		eq([timesYieldedA, timesYieldedB], [1, 0])

		eq(iterB.next(), iterContinue("b"))
		eq([timesYieldedA, timesYieldedB], [1, 1])

		eq(iterA.next(), iterContinue("b"))
		eq([timesYieldedA, timesYieldedB], [1, 1])

		eq(iterA.next(), iterDone)
		eq(iterB.next(), iterDone)
		eq([timesYieldedA, timesYieldedB], [1, 1])
	})

	it("buildTo", () => {
		const arr: number[] = []
		const myBuilder: Builder<number[], number> = {
			add(x): void { arr.unshift(x) },
			finish: () => arr
		}
		eq(nats.buildTo(myBuilder), [2, 1, 0])
	})

	it("toArray", () => {
		eq(nats.toArray(), [0, 1, 2])
	})

	it("toSet", () => {
		eq(nats.toSet(), Set.of(0, 1, 2))
	})

	it("unique", () => {
		seqEq(Seq.of(0, 1, 2, 0, 1, 3).unique, [0, 1, 2, 3])
	})

	it("toMap", () => {
		eq(
			Seq.of<[number, string]>([1, "a"], [2, "b"]).toMap(),
			Map.of([1, "a"], [2, "b"]))
		eq(
			Seq.of<[number, string]>([1, "a"], [1, "A"]).toMap<number, string>(add),
			Map.of([1, "aA"]))
	})

	it("groupBy & groupBySeq", () => {
		const s = Seq.of("ab", "ac", "bb")
		const out: [string, string[]][] = [["a", ["ab", "ac"]], ["b", ["bb"]]]
		eq(s.groupBy(str => str[0]), Map.from(out))
		seqEq(s.groupBySeq(str => str[0]), out)
	})

	it("buildToString", () => {
		eq(nats.map(String).buildToString("|"), "0|1|2")
	})

	it("toString", () => {
		eq(nats.toString(), "Seq(0, 1, 2)")
	})

	it("toJSON", () => {
		eq(JSON.stringify(nats), "[0,1,2]")
	})

	it("each", () => {
		const a: number[] = []
		nats.each(x => a.push(x))
		eq(a, [0, 1, 2])
	})

	it("map", () => {
		seqEq(seq(nats).map(incr), [1, 2, 3])
	})

	it("flatten", () => {
		seqEq(Seq.of([], [1], [2, 3]).flatten(), [1, 2, 3])
	})

	it("flatMap", () => {
		seqEq(nats.flatMap(x => optional(x !== 1, () => [x, x])), [0, 0, 2, 2])
	})

	it("concat", () => {
		seqEq(Seq.of<number>().concat([1], undefined, [2, 3]), [1, 2, 3])
	})

	it("mapDefined", () => {
		seqEq(nats.mapDefined(tryHalve), [0, 1])
	})

	it("getDefined", () => {
		seqEq(Seq.of(0, undefined, 1).getDefined(), [0, 1])
	})

	it("filter", () => {
		seqEq(nats.filter(x => x !== 1), [0, 2])
	})

	it("reduce", () => {
		eq(nats.reduce("", (s, n) => s + n), "012")
	})

	it("contains", () => {
		assert(nats.contains(0))
		assert(!nats.contains(3))
		assert(nats.contains(3, (x, y) => x + y === 5))
		assert(!nats.contains(3, (x, y) => x + y === 6))
	})

	it("find", () => {
		eq(nats.find(x => x + x === 2), 1)
		eq(nats.find(x => x > 2), undefined)
	})

	it("isEmpty", () => {
		assert(Seq.empty.isEmpty)
		assert(!nats.isEmpty)
	})

	it("some", () => {
		assert(!Seq.empty.some(raise))
		assert(nats.some(x => x === 2))
	})

	it("every", () => {
		assert(Seq.empty.every(raise))
		assert(nats.every(x => x < 3))
		assert(!nats.every(x => x < 2))
	})

	it("unshift", () => {
		seqEq(nats.unshift(-1), [-1, 0, 1, 2])
	})

	it("first", () => {
		eq(nats.first, 0)
		eq(Seq.empty.first, undefined)
	})

	it("tail", () => {
		seqEq(nats.tail, [1, 2])
		seqEq(Seq.empty.tail, [])
	})

	it("equals", () => {
		assert(nats.equals([0, 1, 2]))
		assert(!nats.equals([0, 1]))
		assert(nats.equals([10, 11, 12], (a, b) => a % 10 === b % 10))
		assert(!nats.equals([10, 11, 13], (a, b) => a % 10 === b % 10))
	})

	it("take", () => {
		seqEq(nats.take(4), [0, 1, 2])
		seqEq(nats.take(2), [0, 1])
		seqEq(nats.take(0), [])
		throws(() => nats.take(-1))
	})

	it("takeWhile", () => {
		seqEq(nats.takeWhile(x => x < 2), [0, 1])
		seqEq(nats.takeWhile(() => false), [])
		seqEq(nats.takeWhile(() => true), [0, 1, 2])
	})

	it("drop", () => {
		seqEq(nats.drop(4), [])
		seqEq(nats.drop(2), [2])
		seqEq(nats.drop(0), [0, 1, 2])
		throws(() => nats.drop(-1))
	})

	it("dropWhile", () => {
		seqEq(nats.dropWhile(x => x < 2), [2])
		seqEq(nats.dropWhile(() => false), [0, 1, 2])
		seqEq(nats.dropWhile(() => true), [])
	})

	it("zip", () => {
		seqEq(nats.zip([]), [])
		seqEq(nats.zip(["a", "b", "c", "d"]), [[0, "a"], [1, "b"], [2, "c"]])
		seqEq(nats.zip([3, 4, 5], add), [3, 5, 7])
	})

	it("withIndex", () => {
		seqEq(nats.withIndex, [[0, 0], [1, 1], [2, 2]])
	})

	it("sort", () => {
		seqEq(Seq.of(1, 2, 0).sort(), [0, 1, 2])
		seqEq(Seq.of(1, 2, 0).sort((a, b) => b - a), [2, 1, 0])
	})

	it("reverse", () => {
		seqEq(nats.reverse(), [2, 1, 0])
	})

	it("union", () => {
		seqEq(nats.union([1, 2, 3]), [0, 1, 2, 3])
		seqEq(nats.union([]), [0, 1, 2])
	})

	it("intersection", () => {
		seqEq(nats.intersection([1, 2, 3]), [1, 2])
		seqEq(nats.intersection([]), [])
	})

	it("difference", () => {
		seqEq(nats.difference([1, 3]), [0, 2])
		seqEq(nats.difference([]), [0, 1, 2])
	})

	it("count", () => {
		eq(nats.count(), 3)
	})

	it("max", () => {
		eq(Seq.empty.max(), undefined)
		eq(nats.max(), 2)
		eq(nats.max((a, b) => b - a), 0)
	})

	it("min", () => {
		eq(Seq.empty.min(), undefined)
		eq(nats.min(), 0)
		eq(nats.min((a, b) => b - a), 2)
	})

	it("sum", () => {
		eq(nats.sum(), 3)
	})

	it("iterableOfIterator", () => {
		const iter = [][Symbol.iterator]()
		// Identity for iterators that are already iterable.
		eqStrict(iterableOfIterator(iter), iter)

		// Can wrap an iterator in an Iterable.
		function* f() {
			let n = 3
			const myIter = {
				next: () =>
					n > 0 ? iterContinue(n--) : iterDone
			}
			yield* iterableOfIterator(myIter)
		}
		seqEq(new Seq(f), [3, 2, 1])
	})
})
