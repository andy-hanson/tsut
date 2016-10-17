"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const async_1 = require("./async");
const builder_1 = require("./builder");
const function_1 = require("./function");
const map_1 = require("./map");
const math_1 = require("./math");
const option_1 = require("./option");
const parallel_1 = require("./parallel");
const range_1 = require("./range");
const seq_1 = require("./seq");
/** Gets an [[AsyncIterator]] from any iterable object, converting if it has a synchronous iterator. */
function getAsyncIterator(t) {
    return typeof t === "string"
        ? asyncIteratorOfIterator(t[Symbol.iterator]())
        : "asyncIterator" in t
            ? t.asyncIterator()
            : asyncIteratorOfIterator(t[Symbol.iterator]());
}
exports.getAsyncIterator = getAsyncIterator;
/** Converts an Iterator to an [[AsyncIterator]]. */
function asyncIteratorOfIterator(iter) {
    const asyncIter = { next: (value) => Promise.resolve(iter.next(value)) };
    if (iter.return)
        asyncIter.return = (value) => Promise.resolve(iter.return(value));
    if (iter.throw)
        asyncIter.throw = (value) => Promise.resolve(iter.throw(value));
    return asyncIter;
}
/**
Wraps an [[AsyncIterable]] (or any `() => AsyncIterator<T>`) to provide chainable utilities.
There's no way to directly turn an [[AsyncSeq]] back into a [[Seq]],
but you can asynchronously finish with [[eager]], [[toArray]], [[each]], [[reduce]].
*/
class AsyncSeq {
    /**
    Construct an AsyncSeq from any arbitrary function returning an [[AsyncIterator]].
    Async version of the [[Seq]] constructor.
    */
    constructor(asyncIterator) {
        this.asyncIterator = asyncIterator;
    }
    /**
    Wraps any iterator.
    Works for `Iterable<T>`, `AsyncIterable<T>`, or a Promise for either.
    */
    static from(seq) {
        return seq instanceof Promise
            ? new AsyncSeq(() => {
                let iter;
                return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                    if (!option_1.exists(iter))
                        iter = getAsyncIterator(yield seq);
                    return iter.next();
                }));
            })
            : new AsyncSeq(() => getAsyncIterator(seq));
    }
    /** AsyncSeq which yields the given values. */
    static of(...values) {
        return this.from(values);
    }
    /** Yields `initial`, then keeps calling `modify` and yielding the result until it returns `undefined`. */
    static unfold(initial, modify) {
        return new AsyncSeq(() => {
            let state = initial;
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                if (state !== undefined) {
                    const result = seq_1.iterContinue(state);
                    state = yield modify(state);
                    return result;
                }
                else
                    return seq_1.iterDone;
            }));
        });
    }
    /**
    Converts a push-stream to an AsyncSeq.

    `pusherUser` will be called when the sequence is iterated over. (Use [[eager]]/[[memoize]] so that this only happens once.)
    Having utilities for event emitters might be preferrable to using this, but that's not implemented yet.

    Internally keeps a queue of values that have been pushed but not yet pulled, or
    keeps a queue of promises that have been pulled but have not yet been pushed to (resolved).
    */
    static fromPush(pusherUser) {
        return new AsyncSeq(() => {
            let curState = { kind: 0 /* Going */, deferreds: [] };
            // Results that have been pushed that have not yet been pulled.
            let queued = [];
            function mustBeGoing(newState) {
                if (curState.kind === 0 /* Going */)
                    return curState.deferreds;
                else
                    throw new Error(`"${curStateString(newState)}" called after "${curStateString(curState.kind)}"`);
            }
            function curStateString(state) {
                switch (state) {
                    case 0 /* Going */: return "going";
                    case 1 /* Errored */: return "error";
                    case 2 /* Finished */: return "finish";
                }
            }
            pusherUser({
                push(element) {
                    const deferreds = mustBeGoing(0 /* Going */);
                    if (deferreds.length)
                        deferreds.shift().resolve(seq_1.iterContinue(element));
                    else
                        queued.push(element);
                },
                error(error) {
                    const deferreds = mustBeGoing(1 /* Errored */);
                    for (const d of deferreds)
                        d.reject(error);
                    curState = { kind: 1 /* Errored */, error };
                },
                finish() {
                    const deferreds = mustBeGoing(2 /* Finished */);
                    for (const d of deferreds)
                        d.resolve(seq_1.iterDone);
                    curState = { kind: 2 /* Finished */ };
                }
            });
            return asyncIterator(() => {
                if (queued.length)
                    return Promise.resolve(seq_1.iterContinue(queued.shift()));
                else {
                    switch (curState.kind) {
                        case 0 /* Going */: {
                            const [d, promise] = async_1.deferred();
                            // Elements may still be pushed, so add a new deferred.
                            curState.deferreds.push(d);
                            return promise;
                        }
                        case 1 /* Errored */:
                            return Promise.reject(curState.error);
                        case 2 /* Finished */:
                            return Promise.resolve(seq_1.iterDone);
                    }
                    // TODO: https://github.com/Microsoft/TypeScript/issues/11572
                    throw new Error("Unreachable");
                }
            });
        });
    }
    /** Wraps this in a [[ParallelSeq]]. */
    get par() {
        return new parallel_1.ParallelSeq(this);
    }
    /** [[toArray]] wrapped as a [[Seq]]. */
    eager() {
        return __awaiter(this, void 0, void 0, function* () {
            return seq_1.Seq.from(yield this.toArray());
        });
    }
    /** Async [[Seq.memoize]]. */
    get memoize() {
        // All iterators share the cache and the same backing iterator, which may only run once.
        const cache = [];
        const iter = this.asyncIterator();
        let iteratorExhausted = false;
        return new AsyncSeq(() => {
            // Each iterator has its own `i`
            let i = 0;
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                if (i < cache.length) {
                    const cached = cache[i];
                    i++;
                    return seq_1.iterContinue(cached);
                }
                else if (iteratorExhausted)
                    return seq_1.iterDone;
                else {
                    const { value, done } = yield iter.next();
                    if (done) {
                        iteratorExhausted = true;
                        return seq_1.iterDone;
                    }
                    else {
                        cache.push(value);
                        i++;
                        return seq_1.iterContinue(value);
                    }
                }
            }));
        });
    }
    /** Async [[Seq.buildTo]]. */
    buildTo(builder) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.doBuild(builder);
            return builder.finish();
        });
    }
    /** Async [[Seq.doBuilt]]. */
    doBuild(builder) {
        return this.each(element => builder.add(element));
    }
    /** Async [[Seq.toArray]]. */
    toArray() {
        return this.buildTo(new builder_1.ArrayBuilder());
    }
    /** Async [[Seq.toSet]]. */
    toSet() {
        return this.buildTo(new builder_1.SetBuilder());
    }
    /** Async [[Seq.unique]]. */
    get unique() {
        return new AsyncSeq(() => {
            const u = new Set();
            const iter = this.asyncIterator();
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                while (true) {
                    const { value, done } = yield iter.next();
                    if (done)
                        return seq_1.iterDone;
                    else {
                        if (!u.has(value)) {
                            u.add(value);
                            return seq_1.iterContinue(value);
                        }
                    }
                }
            }));
        });
    }
    /** Async [[Seq.toMap]]. */
    toMap(combineValues) {
        return this.buildTo(new builder_1.MapBuilder(combineValues));
    }
    /** Async [[Seq.groupBy]]. */
    groupBy(toKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const map = new Map();
            yield this.each((value) => __awaiter(this, void 0, void 0, function* () {
                const key = yield toKey(value);
                map_1.multiMapAdd(map, key, value);
            }));
            return map;
        });
    }
    /** Async [[Seq.groupBySeq]]. */
    groupBySeq(toKey) {
        return AsyncSeq.from(this.groupBy(toKey));
    }
    /** Async [[Seq.buildToString]]. */
    buildToString(separator) {
        return this.buildTo(new builder_1.StringBuilder(separator));
    }
    /** Returns "AsyncSeq(...)", since this is a synchronous method. Prefer [[buildToString]]. */
    toString() {
        return "AsyncSeq(...)";
    }
    /** Async [[Seq.each]]. */
    each(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const iter = this.asyncIterator();
            while (true) {
                const { value, done } = yield iter.next();
                if (done)
                    break;
                else
                    yield action(value);
            }
        });
    }
    /** Async [[Seq.map]] */
    map(mapper) {
        return new AsyncSeq(() => {
            const iter = this.asyncIterator();
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                const { value, done } = yield iter.next();
                return done ? seq_1.iterDone : seq_1.iterContinue(yield mapper(value));
            }));
        });
    }
    /** Async [[flatten]]. */
    flatten() {
        return new AsyncSeq(() => {
            const outerIter = getAsyncIterator(this);
            let innerIterOption;
            return asyncIterator(() => option_1.exists(innerIterOption) ? innerNext(innerIterOption) : outerNext());
            function innerNext(innerIter) {
                return __awaiter(this, void 0, void 0, function* () {
                    const innerIterResult = yield innerIter.next();
                    if (innerIterResult.done)
                        return outerNext();
                    else
                        return innerIterResult;
                });
            }
            function outerNext() {
                return __awaiter(this, void 0, void 0, function* () {
                    while (true) {
                        const { value, done } = yield outerIter.next();
                        if (done)
                            return seq_1.iterDone;
                        else if (value !== undefined) {
                            innerIterOption = getAsyncIterator(value);
                            return innerNext(innerIterOption);
                        }
                    }
                });
            }
        });
    }
    /** Async [[Seq.flatMap]]. */
    flatMap(mapper) {
        return this.map(mapper).flatten();
    }
    /** Async [[Seq.concat]]. */
    concat(...concatWith) {
        return exports.asyncSeq(concatWith).unshift(this).flatten();
    }
    /** Async [[Seq.mapDefined]]. */
    mapDefined(tryGetOutput) {
        return new AsyncSeq(() => {
            const iter = this.asyncIterator();
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                while (true) {
                    const { value, done } = yield iter.next();
                    if (done)
                        return seq_1.iterDone;
                    else {
                        const mappedValue = yield tryGetOutput(value);
                        if (option_1.exists(mappedValue))
                            return seq_1.iterContinue(mappedValue);
                    }
                }
            }));
        });
    }
    /** Async [[Seq.getDefined]]. */
    getDefined() {
        return this.mapDefined(function_1.identity);
    }
    /** Async [[Seq.filter]]. */
    filter(predicate) {
        return new AsyncSeq(() => {
            const iter = this.asyncIterator();
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                while (true) {
                    const { value, done } = yield iter.next();
                    if (done)
                        return seq_1.iterDone;
                    else {
                        if (yield predicate(value))
                            return seq_1.iterContinue(value);
                    }
                }
            }));
        });
    }
    /** Async [[Seq.reduce]]. */
    reduce(startAccumulator, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            let accumulator = startAccumulator;
            const iter = this.asyncIterator();
            while (true) {
                const { value, done } = yield iter.next();
                if (done)
                    return accumulator;
                else
                    accumulator = yield folder(accumulator, value);
            }
        });
    }
    /** Async [[Seq.contains]]. */
    contains(searchFor, equals) {
        return __awaiter(this, void 0, void 0, function* () {
            const iter = this.asyncIterator();
            while (true) {
                const { value, done } = yield iter.next();
                if (done)
                    return false;
                else if (option_1.exists(equals) ? equals(value, searchFor) : value === searchFor)
                    return true;
            }
        });
    }
    /** Async [[Seq.find]]. */
    find(predicate) {
        return __awaiter(this, void 0, void 0, function* () {
            const iter = this.asyncIterator();
            while (true) {
                const { value, done } = yield iter.next();
                if (done)
                    return undefined;
                else if (yield predicate(value))
                    return value;
            }
        });
    }
    /** Async [[Seq.isEmpty]]. */
    get isEmpty() {
        return async_1.toPromise(this.asyncIterator().next()).then(({ done }) => done);
    }
    /** Async [[Seq.some]]. */
    some(predicate) {
        return __awaiter(this, void 0, void 0, function* () {
            const iter = this.asyncIterator();
            while (true) {
                const { value, done } = yield iter.next();
                if (done)
                    return false;
                else if (predicate(value))
                    return true;
            }
        });
    }
    /** Async [[Seq.every]]. */
    every(predicate) {
        return __awaiter(this, void 0, void 0, function* () {
            const iter = this.asyncIterator();
            while (true) {
                const { value, done } = yield iter.next();
                if (done)
                    return true;
                else if (!predicate(value))
                    return false;
            }
        });
    }
    /** Async [[Seq.unshift]]. */
    unshift(value) {
        return new AsyncSeq(() => {
            let selfIter;
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                if (selfIter !== undefined)
                    return yield selfIter.next();
                else {
                    const result = seq_1.iterContinue(yield value);
                    selfIter = this.asyncIterator();
                    return result;
                }
            }));
        });
    }
    /** Async [[Seq.first]]. */
    get first() {
        return async_1.toPromise(this.asyncIterator().next()).then(({ value, done }) => option_1.optional(!done, () => value));
    }
    /** Async [[Seq.tail]]. */
    get tail() {
        return this.drop(1);
    }
    /** Async [[Seq.equals]]. */
    equals(other, elementEqual) {
        return __awaiter(this, void 0, void 0, function* () {
            const ia = this.asyncIterator();
            const ib = getAsyncIterator(other);
            while (true) {
                const { value: va, done: da } = yield ia.next();
                const { value: vb, done: db } = yield ib.next();
                if (da || db)
                    return da === db;
                else if (option_1.exists(elementEqual) ? !(yield elementEqual(va, vb)) : va !== vb)
                    return false;
            }
        });
    }
    /** Async [[Seq.take]]. */
    take(numberToTake) {
        math_1.checkNat(numberToTake);
        return new AsyncSeq(() => {
            const iter = this.asyncIterator();
            let n = numberToTake;
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                if (n <= 0)
                    return seq_1.iterDone;
                else {
                    n--;
                    const { value, done } = yield iter.next();
                    if (done)
                        return seq_1.iterDone;
                    else
                        return seq_1.iterContinue(value);
                }
            }));
        });
    }
    /** Async [[Seq.takeWhile]]. */
    takeWhile(predicate) {
        return new AsyncSeq(() => {
            const iter = this.asyncIterator();
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                const { value, done } = yield iter.next();
                return !done && (yield predicate(value))
                    ? seq_1.iterContinue(value)
                    : seq_1.iterDone;
            }));
        });
    }
    /** Async [[Seq.drop]]. */
    drop(numberToDrop) {
        math_1.checkNat(numberToDrop);
        return new AsyncSeq(() => {
            const iter = this.asyncIterator();
            let n = numberToDrop;
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                for (; n > 0; n--) {
                    const { done } = yield iter.next();
                    if (done)
                        return seq_1.iterDone;
                }
                return iter.next();
            }));
        });
    }
    /** Async [[Seq.dropWhile]]. */
    dropWhile(predicate) {
        return new AsyncSeq(() => {
            const iter = this.asyncIterator();
            let dropped = false;
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                if (dropped)
                    return yield iter.next();
                else
                    while (true) {
                        const { value, done } = yield iter.next();
                        if (done) {
                            dropped = true;
                            return seq_1.iterDone;
                        }
                        if (!(yield predicate(value))) {
                            dropped = true;
                            return seq_1.iterContinue(value);
                        }
                    }
            }));
        });
    }
    zip(other, zipper) {
        return new AsyncSeq(() => {
            const leftIter = this.asyncIterator();
            const rightIter = getAsyncIterator(other);
            return asyncIterator(() => __awaiter(this, void 0, void 0, function* () {
                const [{ value: leftValue, done: leftDone }, { value: rightValue, done: rightDone }] = yield Promise.all([yield leftIter.next(), yield rightIter.next()]);
                if (leftDone || rightDone)
                    return seq_1.iterDone;
                return seq_1.iterContinue(option_1.exists(zipper) ? yield zipper(leftValue, rightValue) : [leftValue, rightValue]);
            }));
        });
    }
    /** Async [[Seq.withIndex]]. */
    get withIndex() {
        return this.zip(range_1.Range.nats);
    }
    /** Async [[Seq.union]]. */
    union(other) {
        return this.concat(other).unique;
    }
    /** Async [[Seq.intersection]]. */
    intersection(other) {
        return AsyncSeq.from((() => __awaiter(this, void 0, void 0, function* () {
            const r = yield AsyncSeq.from(other).toSet();
            return this.filter(element => r.has(element));
        }))());
    }
    /** Async [[Seq.difference]]. */
    difference(other) {
        return AsyncSeq.from((() => __awaiter(this, void 0, void 0, function* () {
            const r = yield AsyncSeq.from(other).toSet();
            return this.filter(element => !r.has(element));
        }))());
    }
    /** Async [[Seq.count]]. */
    count() {
        return this.reduce(0, math_1.incr);
    }
    max(comparer) {
        return __awaiter(this, void 0, void 0, function* () {
            let max;
            yield this.each((element) => __awaiter(this, void 0, void 0, function* () {
                if (!option_1.exists(max) || (option_1.exists(comparer) ? (yield comparer(element, max)) > 0 : element > max))
                    max = element;
            }));
            return max;
        });
    }
    min(comparer) {
        return __awaiter(this, void 0, void 0, function* () {
            let min;
            yield this.each((element) => __awaiter(this, void 0, void 0, function* () {
                if (!option_1.exists(min) || (option_1.exists(comparer) ? (yield comparer(element, min)) < 0 : element < min))
                    min = element;
            }));
            return min;
        });
    }
    /** Async [[Seq.sum]]. */
    sum() {
        return this.reduce(0, math_1.add);
    }
}
/** AsyncSeq with no elements. */
AsyncSeq.empty = new AsyncSeq(function_1.thunk(asyncIterator(function_1.thunk(Promise.resolve({ value: undefined, done: true })))));
exports.AsyncSeq = AsyncSeq;
/** Shorthand for [[AsyncSeq.from]]. */
exports.asyncSeq = AsyncSeq.from;
/** Creates an [[AsyncIterator]] from a `next` callback. */
function asyncIterator(next) {
    return { next };
}
exports.asyncIterator = asyncIterator;
//# sourceMappingURL=asyncSeq.js.map