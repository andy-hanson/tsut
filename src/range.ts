import { Nat } from "./math"
import { exists } from "./option"
import { Seq, seq } from "./seq"

/**
[low, high): The range including low but not including high.
Use like: `for (const i of range(0, 10)) ...`
*/
export function range(start: number, end: number, step?: number): Range {
	return new Range(start, end, step)
}

/** Type returned by [[range]]. */
export class Range implements Iterable<number> {
	static nats: Range & Iterable<Nat> = new Range(0, Number.POSITIVE_INFINITY)

	/**
	Step taken to reach the next number.
	May be negative; must be in the direction start -> end.
	*/
	readonly step: number

	constructor(readonly start: number, readonly end: number, step?: number) {
		if (exists(step)) {
			if (Math.sign(step) !== Math.sign(end - start))
				throw new Error(`Step must be in the direction start -> end: wanted ${start} -> ${end}, got ${step}`)
			this.step = step
		} else
			this.step = Math.sign(end - start) || 1
	}

	*[Symbol.iterator](): Iterator<number> {
		if (this.start < this.end) {
			let n = this.start
			while (n < this.end) {
				yield n
				n += this.step
			}
		} else {
			let n = this.start
			while (n > this.end) {
				yield n
				n += this.step
			}
		}
	}

	/** Wraps this in a [[Seq]]. */
	get seq(): Seq<number> {
		return seq(this)
	}

	/** Reverse range, e.g. 1, 2, 3 becomes 3, 2, 1. */
	get reverse(): Range {
		return new Range(this.end, this.start, -this.step)
	}

	/** Size of the range. Always positive. */
	get span(): number {
		return Math.abs(this.end - this.start)
	}

	/**
	Whether a number is contained in the range [start, end].
	(That notation means: including both ends.)
	*/
	spanContains(value: number): boolean {
		const { start, end } = this
		return start < end
			? value >= start && value <= end
			: value <= start && value >= end
	}

	/** Increases or decreases a value so that the range contains it. */
	clamp(value: number): number {
		const { start, end } = this
		return start < end
			? value < start ? start : value > end ? end : value
			: value > start ? start : value < end ? end : value
	}
}
