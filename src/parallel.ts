import { AnyIterable, AsyncSeq, asyncIterator } from "./asyncSeq"
import { Nat, checkNat } from "./math"
import { Option, exists, optional } from "./option"
import { iterContinue, iterDone } from "./seq"

/**
Wraps an [[AsyncSeq]] to provide parallel utilities.
That these do not chaing to ParallelSeq; methods return [[AsyncSeq]]s.
Note: This does not parallelize the *wrapped* sequence. It only runs *future* operations in parallel.
*/
export class ParallelSeq<T> {
	constructor(
		/** Wrapped sequence. */
		readonly seq: AsyncSeq<T>,
		/**
		Number of threads to run at once.
		You'll have to profile to determine an optimal number.
		*/
		readonly maxNumberOfThreads: Nat = Number.POSITIVE_INFINITY) {

		if (maxNumberOfThreads !== Number.POSITIVE_INFINITY) {
			checkNat(maxNumberOfThreads)
			if (maxNumberOfThreads <= 1)
				throw new Error("maxNumberOfThreads must not be > 1.")
		}
	}

	/** Limits the number of threads that may run at once. */
	nThreads(maxNumberOfThreads: number): ParallelSeq<T> {
		return new ParallelSeq(this.seq, maxNumberOfThreads)
	}

	/** [[AsyncSeq.each]] that works on [[maxNumberOfThreads]] inputs at a time. */
	async each(action: (input: T) => Promise<void>): Promise<void> {
		await this.map(action).eager()
	}

	/** [[AsyncSeq.map]] that works on [[maxNumberOfThreads]] inputs at a time. */
	map<U>(mapper: (input: T) => Promise<U>): AsyncSeq<U> {
		// There are N threads in play at once:
		// N - 1 in the `threads` array, and 1 held in a local variable (`next`).
		// e.g. if we're only running 1 thread at a time, we don't need a thread queue at all.
		const maxThreadsLength = this.maxNumberOfThreads - 1

		return new AsyncSeq<U>(() => {
			const iter = this.seq.asyncIterator()
			let threads: Option<Promise<U>[]>

			let inputIsDone = false

			return asyncIterator(async () => {
				if (!exists(threads)) {
					// First iteration

					// Grab the first value to be yielded before starting any threads.
					const { value, done } = await iter.next()
					if (done)
						// Input was completely empty.
						return iterDone
					// Don't await it yet; let it work while we start more threads.
					const next = mapper(value)

					threads = []
					while (threads.length < maxThreadsLength) {
						const { value, done } = await iter.next()
						if (done) {
							inputIsDone = true
							break
						} else
							threads.push(mapper(value))
					}

					return iterContinue(await next)

				} else {
					const next = threads.shift()
					if (!next)
						return iterDone

					// Start a new thread to replace it
					if (!inputIsDone) {
						const { value, done } = await iter.next()
						if (done)
							inputIsDone = true
						else
							threads.push(mapper(value))
					}

					return iterContinue(await next)
				}
			})
		})
	}

	/**
	[[AsyncSeq.flatMap]] that works on [[maxNumberOfThreads]] inputs at a time.
	Runs `getOutputs` in parallel, but the sequences it returns are *not* run in parallel.
	*/
	flatMap<U>(getOutputs: (input: T) => Promise<Option<AnyIterable<U>>>): AsyncSeq<U> {
		return this.map(getOutputs).flatten()
	}

	/** [[AsyncSeq.mapDefined]] that works on [[maxNumberOfThreads]] inputs at a time. */
	mapDefined<U>(tryGetOutput: (input: T) => Promise<Option<U>>): AsyncSeq<U> {
		return this.map(tryGetOutput).getDefined()
	}

	/** [[AsyncSeq.filter]] that works on [[maxNumberOfThreads]] inputs at a time. */
	filter(predicate: (element: T) => Promise<boolean>): AsyncSeq<T> {
		return this.mapDefined(async element => optional(await predicate(element), () => element))
	}
}
