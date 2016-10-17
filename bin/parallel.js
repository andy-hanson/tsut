"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const asyncSeq_1 = require("./asyncSeq");
const math_1 = require("./math");
const option_1 = require("./option");
const seq_1 = require("./seq");
/**
Wraps an [[AsyncSeq]] to provide parallel utilities.
That these do not chaing to ParallelSeq; methods return [[AsyncSeq]]s.
Note: This does not parallelize the *wrapped* sequence. It only runs *future* operations in parallel.
*/
class ParallelSeq {
    constructor(
        /** Wrapped sequence. */
        seq, 
        /**
        Number of threads to run at once.
        You'll have to profile to determine an optimal number.
        */
        maxNumberOfThreads = Number.POSITIVE_INFINITY) {
        this.seq = seq;
        this.maxNumberOfThreads = maxNumberOfThreads;
        if (maxNumberOfThreads !== Number.POSITIVE_INFINITY) {
            math_1.checkNat(maxNumberOfThreads);
            if (maxNumberOfThreads <= 1)
                throw new Error("maxNumberOfThreads must not be > 1.");
        }
    }
    /** Limits the number of threads that may run at once. */
    nThreads(maxNumberOfThreads) {
        return new ParallelSeq(this.seq, maxNumberOfThreads);
    }
    /** [[AsyncSeq.each]] that works on [[maxNumberOfThreads]] inputs at a time. */
    each(action) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.map(action).eager();
        });
    }
    /** [[AsyncSeq.map]] that works on [[maxNumberOfThreads]] inputs at a time. */
    map(mapper) {
        // There are N threads in play at once:
        // N - 1 in the `threads` array, and 1 held in a local variable (`next`).
        // e.g. if we're only running 1 thread at a time, we don't need a thread queue at all.
        const maxThreadsLength = this.maxNumberOfThreads - 1;
        return new asyncSeq_1.AsyncSeq(() => {
            const iter = this.seq.asyncIterator();
            let threads;
            let inputIsDone = false;
            return asyncSeq_1.asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                if (!option_1.exists(threads)) {
                    // First iteration
                    // Grab the first value to be yielded before starting any threads.
                    const { value, done } = yield iter.next();
                    if (done)
                        // Input was completely empty.
                        return seq_1.iterDone;
                    // Don't await it yet; let it work while we start more threads.
                    const next = mapper(value);
                    threads = [];
                    while (threads.length < maxThreadsLength) {
                        const { value, done } = yield iter.next();
                        if (done) {
                            inputIsDone = true;
                            break;
                        }
                        else
                            threads.push(mapper(value));
                    }
                    return seq_1.iterContinue(yield next);
                }
                else {
                    const next = threads.shift();
                    if (!next)
                        return seq_1.iterDone;
                    // Start a new thread to replace it
                    if (!inputIsDone) {
                        const { value, done } = yield iter.next();
                        if (done)
                            inputIsDone = true;
                        else
                            threads.push(mapper(value));
                    }
                    return seq_1.iterContinue(yield next);
                }
            }));
        });
    }
    /**
    [[AsyncSeq.flatMap]] that works on [[maxNumberOfThreads]] inputs at a time.
    Runs `getOutputs` in parallel, but the sequences it returns are *not* run in parallel.
    */
    flatMap(getOutputs) {
        return this.map(getOutputs).flatten();
    }
    /** [[AsyncSeq.mapDefined]] that works on [[maxNumberOfThreads]] inputs at a time. */
    mapDefined(tryGetOutput) {
        return this.map(tryGetOutput).getDefined();
    }
    /** [[AsyncSeq.filter]] that works on [[maxNumberOfThreads]] inputs at a time. */
    filter(predicate) {
        return this.mapDefined((element) => __awaiter(this, void 0, void 0, function* () { return option_1.optional(yield predicate(element), () => element); }));
    }
}
exports.ParallelSeq = ParallelSeq;
//# sourceMappingURL=parallel.js.map