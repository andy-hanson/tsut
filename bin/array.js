"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const math_1 = require("./math");
const option_1 = require("./option");
const seq_1 = require("./seq");
/**
Empty immutable array.
Using this instead of a literal array `[]` to avoid allocating memory.
*/
exports.empty = Object.freeze([]); // TODO: Cast not needed in TypeScript 2.0.5
/**
Replace each element with the result of calling `getNewValue`.
If `getNewValue` throws, the inputs will be left in a bad state.
(To mutate each element in place, just use a for-of loop.)
*/
function mapMutate(inputs, getNewValue) {
    for (let index = 0; index < inputs.length; index++)
        inputs[index] = getNewValue(inputs[index], index);
}
exports.mapMutate = mapMutate;
/**
Delete elements of an array not satisfying `predicate`.
If `predicate` throws, the array will be left in a bad state.
*/
function filterMutate(inputs, predicate) {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < inputs.length; readIndex++)
        if (predicate(inputs[readIndex])) {
            inputs[writeIndex] = inputs[readIndex];
            writeIndex++;
        }
    inputs.length = writeIndex;
}
exports.filterMutate = filterMutate;
/**
Replace elements with the result of [[tryGetOutput]] or delete them if that returns `undefined`.
If [[tryGetOutput] throws, the array will be left in a bad state.
*/
function mapDefinedMutate(inputs, tryGetOutput) {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < inputs.length; readIndex++) {
        const output = tryGetOutput(inputs[readIndex]);
        if (output !== undefined) {
            inputs[writeIndex] = output;
            writeIndex++;
        }
    }
    inputs.length = writeIndex;
}
exports.mapDefinedMutate = mapDefinedMutate;
/** Change the value at a single index in an array by applying a function to it. */
function mutate(inputs, index, transform) {
    checkIndex(inputs, index);
    inputs[index] = transform(inputs[index]);
}
exports.mutate = mutate;
/**
Remove an element from an array and do not preserve the array's order.
Useful for arrays used to represent small sets.
Returns whether the value was successfully removed.
*/
function removeUnordered(inputs, value, equal) {
    for (let i = 0; i < inputs.length; i++)
        if (option_1.exists(equal) ? equal(inputs[i], value) : inputs[i] === value) {
            inputs[i] = last(inputs);
            inputs.length--;
            return true;
        }
    return false;
}
exports.removeUnordered = removeUnordered;
/**
Mutate [[inputs]] by combining them with each in [[other]].
If [[other]] is shorter than [[inputs]], this will reduce [[inputs]] in length.
If [[other]] is longer, the extra entries are ignored.
*/
function zipMutate(inputs, other, zipper) {
    const iter = other[Symbol.iterator]();
    for (let index = 0; index < inputs.length; index++) {
        const { value, done } = iter.next();
        if (done) {
            inputs.length = index;
            break;
        }
        inputs[index] = zipper(inputs[index], value);
    }
}
exports.zipMutate = zipMutate;
/** Provides async utilities for an array. */
function asyncArray(inputs) {
    return new AsyncArrayOps(inputs);
}
exports.asyncArray = asyncArray;
/**
Wrapper class for utilities that mutate arrays asynchronously.
For non-mutating utilities use [[AsyncSeq]].
*/
class AsyncArrayOps {
    constructor(inputs) {
        this.inputs = inputs;
        // https://github.com/Microsoft/TypeScript/issues/11324
        // tslint:disable-next-line:no-unused-expression
        this.inputs;
    }
    /** Asynchronous [[mapMutate]]. */
    map(getNewValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputs } = this;
            for (let index = 0; index < inputs.length; index++)
                inputs[index] = yield getNewValue(inputs[index], index);
        });
    }
    /** Asynchronous [[filterMutate]]. */
    filter(predicate) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputs } = this;
            let writeIndex = 0;
            for (let readIndex = 0; readIndex < inputs.length; readIndex++)
                if (yield predicate(inputs[readIndex])) {
                    inputs[writeIndex] = inputs[readIndex];
                    writeIndex++;
                }
            inputs.length = writeIndex;
        });
    }
    /** Asynchronous [[mapDefinedMutate]]. Performs `tryGetOutput` one element at a time. */
    mapDefined(tryGetOutput) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputs } = this;
            let writeIndex = 0;
            for (let readIndex = 0; readIndex < inputs.length; readIndex++) {
                const output = yield tryGetOutput(inputs[readIndex]);
                if (output !== undefined) {
                    inputs[writeIndex] = output;
                    writeIndex++;
                }
            }
            inputs.length = writeIndex;
        });
    }
    /** Asynchronous [[mutate]]. */
    mutate(index, transform) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputs } = this;
            checkIndex(inputs, index);
            inputs[index] = yield transform(inputs[index]);
        });
    }
}
exports.AsyncArrayOps = AsyncArrayOps;
/** Provides parallel utilities for an array. */
function parallelArray(inputs, maxNumberOfThreads) {
    return new ParallelArrayOps(inputs, maxNumberOfThreads);
}
exports.parallelArray = parallelArray;
/**
Wrapper class for utilities that mutate arrays in parallel.
For non-mutating utilities use [[ParallelSeq]].
*/
class ParallelArrayOps {
    /** Use [[parallelArray]] rather than calling this directly. */
    constructor(inputs, maxNumberOfThreads = Number.POSITIVE_INFINITY) {
        this.inputs = inputs;
        this.maxNumberOfThreads = maxNumberOfThreads;
        if (maxNumberOfThreads !== Number.POSITIVE_INFINITY)
            math_1.checkNat(maxNumberOfThreads);
    }
    /** Parallel [[mapMutate]]. */
    map(mapper) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputs, maxNumberOfThreads } = this;
            let writeIndex = 0;
            let readIndex = 0;
            while (readIndex < maxNumberOfThreads && readIndex < inputs.length)
                startOne();
            while (readIndex < inputs.length) {
                yield awaitOne();
                startOne();
            }
            while (writeIndex < inputs.length)
                yield awaitOne();
            function awaitOne() {
                return __awaiter(this, void 0, void 0, function* () {
                    inputs[writeIndex] = yield inputs[writeIndex];
                    writeIndex++;
                });
            }
            function startOne() {
                inputs[readIndex] = mapper(inputs[readIndex], readIndex);
                readIndex++;
            }
        });
    }
    /** Parallel [[filterMutate]]. */
    filter(predicate) {
        return this.mapDefined((input, index) => __awaiter(this, void 0, void 0, function* () {
            return option_1.optional(yield predicate(input, index), () => input);
        }));
    }
    /** Parallel [[mapDefinedMutate]]. */
    mapDefined(tryGetOutput) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputs, maxNumberOfThreads } = this;
            /** Next index to write a (defined) result to. */
            let writeOutputIndex = 0;
            /** Next index to await a thread at. */
            let readPromiseIndex = 0;
            /** Next index to read an input value from; the thread for that input will be written to the same index. */
            let readValueIndex = 0;
            // Start initial threads.
            while (readValueIndex < maxNumberOfThreads && readValueIndex < inputs.length)
                startOne();
            // Keep awaiting threads and starting new ones.
            // Invariants: writeIndex <= readPromiseIndex, readPromiseIndex = readValueIndex - numberOfThreads
            while (readValueIndex < inputs.length) {
                yield awaitOne();
                startOne();
            }
            // Await remaining threads.
            while (readPromiseIndex < inputs.length)
                yield awaitOne();
            // Shorten array to new length.
            inputs.length = writeOutputIndex;
            function awaitOne() {
                return __awaiter(this, void 0, void 0, function* () {
                    const output = yield inputs[readPromiseIndex];
                    readPromiseIndex++;
                    if (output !== undefined) {
                        inputs[writeOutputIndex] = output;
                        writeOutputIndex++;
                    }
                });
            }
            function startOne() {
                inputs[readValueIndex] = tryGetOutput(inputs[readValueIndex], readValueIndex);
                readValueIndex++;
            }
        });
    }
}
exports.ParallelArrayOps = ParallelArrayOps;
/**
Whether a number is an integer between 0 and array.length.
Does *not* check for whether there is a "hole" at the index.
*/
function isValidIndex(inputs, index) {
    return math_1.isNat(index) && index < inputs.length;
}
exports.isValidIndex = isValidIndex;
/** Throws an error if [[index]] is not a valid index. */
function checkIndex(inputs, index) {
    if (!isValidIndex(inputs, index))
        throw new Error(`Expected an array index < ${inputs.length}, got ${index}`);
}
exports.checkIndex = checkIndex;
/** Swap two values in an array. */
function swap(inputs, firstIndex, secondIndex) {
    checkIndex(inputs, firstIndex);
    checkIndex(inputs, secondIndex);
    const tmp = inputs[firstIndex];
    inputs[firstIndex] = inputs[secondIndex];
    inputs[secondIndex] = tmp;
}
exports.swap = swap;
/** Initialize a new array by calling [[makeElement]] [[length]] times. */
function initArray(length, makeElement) {
    const arr = new Array(length);
    for (let i = 0; i < length; i++)
        arr[i] = makeElement(i);
    return arr;
}
exports.initArray = initArray;
/** Asynchronous [[initArray]]. */
function initArrayAsync(length, makeElement) {
    return Promise.all(initArray(length, makeElement));
}
exports.initArrayAsync = initArrayAsync;
/** Parallel [[initArray]]. */
function initArrayParallel(numberOfThreads, length, makeElement) {
    return __awaiter(this, void 0, void 0, function* () {
        const array = new Array(length);
        yield parallelArray(array, numberOfThreads).map((_, index) => makeElement(index));
        return array;
    });
}
exports.initArrayParallel = initArrayParallel;
/**
[[Seq]] iterating over an array in reverse.
O(1) to create.
*/
function reverse(array) {
    return new seq_1.Seq(function* () {
        for (let i = array.length - 1; i >= 0; i--)
            yield array[i];
    });
}
exports.reverse = reverse;
/** Immutable `Array.prototype.shift`. */
function shift(array) {
    return option_1.optional(!isEmpty(array), () => [array[0], array.slice(1)]);
}
exports.shift = shift;
/**
Every item but the first.
Identity for empty arrays.
*/
function tail(array) {
    return array.slice(1);
}
exports.tail = tail;
/** True iff an array has 0 length. */
function isEmpty(array) {
    return array.length === 0;
}
exports.isEmpty = isEmpty;
/**
Every item but the last.
Identity for empty arrays.
*/
function rightTail(array) {
    return array.slice(0, array.length - 1);
}
exports.rightTail = rightTail;
/** Immutable `Array.prototype.pop`. */
function pop(array) {
    return option_1.iff(last(array), popped => [rightTail(array), popped]);
}
exports.pop = pop;
/** Last element in the array. */
function last(array) {
    return array[array.length - 1];
}
exports.last = last;
//# sourceMappingURL=array.js.map