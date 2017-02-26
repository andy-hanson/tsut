"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncSeq_1 = require("./asyncSeq");
const builder_1 = require("./builder");
const function_1 = require("./function");
const map_1 = require("./map");
const math_1 = require("./math");
const option_1 = require("./option");
const range_1 = require("./range");
const set_1 = require("./set");
/** IteratorResult for when there are no values left in the sequence. */
exports.iterDone = { value: undefined, done: true };
/** IteratorResult to yield a single value and continue. */
function iterContinue(value) {
    return { value, done: false };
}
exports.iterContinue = iterContinue;
/**
Wraps an Iterable (or any `() => Iterator<T>`) to provide chainable utilities.
It's not recommended to store a Seq in memory -- use [[toArray]] first.
Also, since elements are computed on demand, use [[eager]] or [[memoize]]
rather than using the same Seq twice.
*/
class Seq {
    /**
    Construct a Seq from any arbitrary function returning an Iterator.

    To support iterating more than once, set up any reused state *within* `getIterator`,
    which is called each time the sequence is iterated over.
    For example: prefer `new Seq(function*() { for (let i = 0; i < 3; i++) yield i })`
    over `let i = 0; new Seq(function*() { ... })`
    */
    constructor(getIterator) {
        this[Symbol.iterator] = getIterator;
    }
    /** Wrap an Iterable. */
    static from(iterable) {
        return new Seq(() => iterable[Symbol.iterator]());
    }
    /** Seq which yields the given values. */
    static of(...values) {
        return this.from(values);
    }
    /** Repeats the same value forever. */
    static repeat(value) {
        return new Seq(() => iterator(() => iterContinue(value)));
    }
    /** Repeats the same sequence forever. */
    static cycle(repeated) {
        return new Seq(function* () {
            while (true)
                yield* repeated;
        });
    }
    /** Yields `initial`, then keeps calling `modify` and yielding the result until it returns `undefined`. */
    static unfold(initial, modify) {
        return new Seq(function* () {
            let state = initial;
            while (state !== undefined) {
                yield state;
                state = modify(state);
            }
        });
    }
    /** Allow to view an Option as a Seq of 0 or 1 values. */
    static ofOption(option) {
        return option_1.exists(option) ? Seq.of(option) : Seq.empty;
    }
    /** Async utilities. See AsyncSeq for documentation. */
    get async() {
        return asyncSeq_1.AsyncSeq.from(this);
    }
    /** Parallel utilities. See ParallelSeq for documentation. */
    get par() {
        return this.async.par;
    }
    /**
    Eagerly evaluates all elements.
    Use this is you will perform multiple queries to the same Seq
    and you know the queries will use every element.
    (Else, use [[memoize]].)
    */
    eager() {
        return Seq.from(Array.from(this));
    }
    /**
    Remembers values that have been computed before.
    (Maintains a single iterator and a cache of previous iteration results.)
    Use this if you will perform multiple queries to the same Seq
    and you don't know if they will use every element.
    */
    get memoize() {
        const cache = [];
        const iter = this[Symbol.iterator]();
        let iteratorExhausted = false;
        return new Seq(function* () {
            // Others are concurrently pushing to `cache`,
            // so must keep checking cache rather than using for-of.
            for (let i = 0;; i++) {
                if (i < cache.length)
                    yield cache[i];
                else if (iteratorExhausted)
                    break;
                else {
                    const { value, done } = iter.next();
                    if (done) {
                        iteratorExhausted = true;
                        break;
                    }
                    else {
                        cache.push(value);
                        yield value;
                    }
                }
            }
        });
    }
    /** Write out elements to a Builder and finish the Builder. */
    buildTo(builder) {
        this.doBuild(builder);
        return builder.finish();
    }
    /** Write out elements to a Builder, but do not finish. */
    doBuild(builder) {
        for (const element of this)
            builder.add(element);
    }
    /** Array.from(this) */
    toArray() {
        return Array.from(this);
    }
    /** Set.from(this) */
    toSet() {
        return Set.from(this);
    }
    /** Seq that avoids repeating the same element twice. */
    get unique() {
        const self = this;
        return new Seq(function* () {
            const u = new Set();
            for (const element of self) {
                if (!u.has(element)) {
                    u.add(element);
                    yield element;
                }
            }
        });
    }
    /**
    `Map.from(this)` if no `combineValues` is provided.
    See [[MapBuilder]] for documentation on `combineValues`.
    To let multiple values share a key, see [[groupByToMap]].
    */
    toMap(combineValues) {
        return option_1.exists(combineValues) ? this.buildTo(new builder_1.MapBuilder(combineValues)) : Map.from(this);
    }
    /**
    Generates a [key, value] pair for each element and
    creates a `Map` from a key to all values with that key.
    */
    groupBy(toKey) {
        const map = new Map();
        for (const value of this) {
            const key = toKey(value);
            map_1.multiMapAdd(map, key, value);
        }
        return map;
    }
    /** Like [[groupBy]] but wraps the result as a [[Seq]]. */
    groupBySeq(toKey) {
        return exports.seq(this.groupBy(toKey));
    }
    /** Adds all elements to a [[StringBuilder]]. */
    buildToString(separator) {
        return this.buildTo(new builder_1.StringBuilder(separator));
    }
    /**
    Stringifies by calling `toString()` on each element.
    Prefer [[buildToString]] to get more control over the output.
    */
    toString() {
        return `Seq(${this.map(x => x.toString()).buildToString(", ")})`;
    }
    /** Exists so that `JSON.stringify(seq)` will work as if it were an array. */
    toJSON() {
        return Array.from(this);
    }
    /** Eagerly performs an action on every element. */
    each(action) {
        for (const element of this)
            action(element);
    }
    /** Runs `getOutput` to produce values for the output Seq. */
    map(getOutput) {
        const self = this;
        return new Seq(function* () {
            for (const element of self)
                yield getOutput(element);
        });
    }
    /**
    Concatenates iterables together, and skips `undefined`.
    Note: as the type indicates, this does not deeply flatten.
    So `Seq.of([1], [[2]]).flatten()` is `Seq.of(1, [2])`.
    */
    flatten() {
        const self = this;
        return new Seq(function* () {
            for (const element of self)
                if (element)
                    yield* element;
        });
    }
    /** `map(mapper).flatten()` */
    flatMap(mapper) {
        return this.map(mapper).flatten();
    }
    /**
    Adds other iterables onto the end of this.
    Undefined ones will be ignored.
    Equivalent to `seq([this, ...concatWith]).flatten()`.
    */
    concat(...concatWith) {
        const self = this;
        return new Seq(function* () {
            yield* self;
            for (const c of concatWith)
                if (c)
                    yield* c;
        });
    }
    /**
    `map(tryGetOutput).getDefined()`.

    Prefer this over map+filter combinations:
    Prefer `seq.mapDefined(x => optional(f(x), () => g(x))` over `seq.filter(x => f(x)).map(x => g(x))`,
    and `seq.mapDefined(x => keepIf(f(x), y => g(y))` over `seq.map(x => f(x)).filter(y => g(y))`.
    */
    mapDefined(tryGetOutput) {
        const self = this;
        return new Seq(function* () {
            for (const element of self) {
                const output = tryGetOutput(element);
                if (option_1.exists(output))
                    yield output;
            }
        });
    }
    /** Filters out undefined values. */
    getDefined() {
        return this.filter(option_1.exists);
    }
    /** Seq containing only elements satisfying `keepIf`. */
    filter(keepIf) {
        const self = this;
        return new Seq(function* () {
            for (const element of self)
                if (keepIf(element))
                    yield element;
        });
    }
    /**
    Start with `startAccumulator`, and keep applying `folder` for each element in the Seq.

    Note: Avoid this pattern:

        s.reduce([], (a, e) => returning(a, () => a.push(e)))

    where the value returned by `folder is always the same value.
    It's more honest to just write this as a `for-of` loop mutating a value.
    Complex bodies are also better replaced by a loop.
    */
    reduce(startAccumulator, folder) {
        let accumulator = startAccumulator;
        for (const element of this)
            accumulator = folder(accumulator, element);
        return accumulator;
    }
    /**
    Returns true if `searchFor` is in the Seq somewhere.
    Same as `some(eq(searchFor))` or `some(x => equals(searchFor, x))`.
    */
    contains(searchFor, equals) {
        for (const element of this)
            if (option_1.exists(equals) ? equals(element, searchFor) : element === searchFor)
                return true;
        return false;
    }
    /**
    Return the first element satisfying a predicate.
    Same as `filter(predicate).first`.
    */
    find(predicate) {
        for (const element of this)
            if (predicate(element))
                return element;
        return undefined;
    }
    /** True iff iteration immediately stops. */
    get isEmpty() {
        return this[Symbol.iterator]().next().done;
    }
    /**
    True iff some element satisfies `predicate`.
    For information about that element use `find`.
    */
    some(predicate) {
        for (const element of this)
            if (predicate(element))
                return true;
        return false;
    }
    /** False iff any element does not satisfy `predicate`. */
    every(predicate) {
        for (const element of this)
            if (!predicate(element))
                return false;
        return true;
    }
    /**
    Seq with a single value prepended to the front.
    Same as `Seq.single(value).concat(this)`.
    */
    unshift(value) {
        const self = this;
        return new Seq(function* () {
            yield value;
            yield* self;
        });
    }
    /** First value or `undefined`. */
    get first() {
        return this[Symbol.iterator]().next().value;
    }
    /** All values but the first. Does nothing for empty sequences. */
    get tail() {
        return this.drop(1);
    }
    /** True iff the sequences contain the same elements in the same order */
    equals(other, elementEqual) {
        const ia = this[Symbol.iterator]();
        const ib = other[Symbol.iterator]();
        while (true) {
            const { value: va, done: da } = ia.next();
            const { value: vb, done: db } = ib.next();
            if (da || db)
                return da === db;
            else if (option_1.exists(elementEqual) ? !elementEqual(va, vb) : va !== vb)
                return false;
        }
    }
    /** First N elements of the sequence. */
    take(numberToTake) {
        math_1.checkNat(numberToTake);
        const self = this;
        return new Seq(function* () {
            if (numberToTake === 0)
                return;
            let n = numberToTake;
            for (const element of self) {
                yield element;
                n--;
                if (n === 0)
                    break;
            }
        });
    }
    /**
    Takes elements so long as `predicate` is true.
    Unlike `filter`, stops as soon as `predicate` is false and does not continue looking.
    */
    takeWhile(predicate) {
        const self = this;
        return new Seq(function* () {
            for (const element of self) {
                if (predicate(element))
                    yield element;
                else
                    break;
            }
        });
    }
    /** Seq without the first `numberToDrop` elements. */
    drop(numberToDrop) {
        math_1.checkNat(numberToDrop);
        const self = this;
        return new Seq(function* () {
            const iter = self[Symbol.iterator]();
            for (let n = numberToDrop; n !== 0; n--)
                if (iter.next().done)
                    return;
            yield* iterableOfIterator(iter);
        });
    }
    /** Drops elements so long as `predicate` is true. */
    dropWhile(predicate) {
        const self = this;
        return new Seq(function* () {
            const iter = self[Symbol.iterator]();
            while (true) {
                const { value, done } = iter.next();
                if (done)
                    break;
                if (!predicate(value)) {
                    yield value;
                    yield* iterableOfIterator(iter);
                }
            }
        });
    }
    zip(other, zipper) {
        return new Seq(() => {
            const leftIter = this[Symbol.iterator]();
            const rightIter = other[Symbol.iterator]();
            return iterator(() => {
                const { value: leftValue, done: leftDone } = leftIter.next();
                if (leftDone)
                    return exports.iterDone;
                const { value: rightValue, done: rightDone } = rightIter.next();
                if (rightDone)
                    return exports.iterDone;
                return iterContinue(option_1.exists(zipper) ? zipper(leftValue, rightValue) : [leftValue, rightValue]);
            });
        });
    }
    /** Seq where each element is paired with its index, starting with 0. */
    get withIndex() {
        return this.zip(range_1.Range.nats);
    }
    sort(comparer) {
        return exports.seq(this.toArray().sort(comparer));
    }
    /** Eagerly evaluates, sorts it, then wraps in a Seq again. */
    reverse() {
        return exports.seq(this.toArray().reverse());
    }
    /** Seq containing the elements in both this and other. */
    union(other) {
        return this.concat(other).unique;
    }
    /** Eagerly evaluates `other` and returns a Seq of the elements in this that are also in `other`. */
    intersection(other) {
        const asSet = set_1.toSet(other);
        return this.filter(element => asSet.has(element));
    }
    /** Eagerly evaluates `other` and returns a Seq of the elements in this not in `other`. */
    difference(other) {
        const asSet = set_1.toSet(other);
        return this.filter(element => !asSet.has(element));
    }
    /**
    Evaluates all elements and returns their count.
    If you want to do other things in addition to counting, consider using `eager` first so the Seq is evaluated only once.
    */
    count() {
        return this.reduce(0, math_1.incr);
    }
    max(comparer) {
        const iter = this[Symbol.iterator]();
        const { value, done } = iter.next();
        if (done)
            return undefined;
        else {
            let max = value;
            for (const element of iter)
                if (option_1.exists(comparer) ? comparer(element, max) > 0 : element > max)
                    max = element;
            return max;
        }
    }
    min(comparer) {
        const iter = this[Symbol.iterator]();
        const { value, done } = iter.next();
        if (done)
            return undefined;
        else {
            let min = value;
            for (const element of this)
                if (option_1.exists(comparer) ? comparer(element, min) < 0 : element < min)
                    min = element;
            return min;
        }
    }
    /** Sum of numbers. */
    sum() {
        return this.reduce(0, math_1.add);
    }
}
/** Seq with no elements. */
Seq.empty = new Seq(function_1.thunk(iterator(() => exports.iterDone)));
exports.Seq = Seq;
/** Shorthand for [[Seq.from]]. */
exports.seq = Seq.from;
/** Creates an iterator from a `next` callback. */
function iterator(next) {
    return { next };
}
exports.iterator = iterator;
/**
Create a single-use Iterable from an Iterator.
Useful for calling `yield*`.
*/
function iterableOfIterator(iterator) {
    return Symbol.iterator in iterator
        ? iterator
        : { [Symbol.iterator]: () => iterator };
}
exports.iterableOfIterator = iterableOfIterator;
//# sourceMappingURL=seq.js.map