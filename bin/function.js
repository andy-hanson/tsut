"use strict";
const math_1 = require("./math");
const option_1 = require("./option");
/** Function that does nothing and returns its input. */
function identity(value) {
    return value;
}
exports.identity = identity;
/** `x => fn2(fn1(x))`. */
function compose(f1, f2) {
    return (input) => f2(f1(input));
}
exports.compose = compose;
function partial(f, ...args) {
    return (...moreArgs) => f(...args, ...moreArgs);
}
exports.partial = partial;
function rpartial(f, ...args) {
    return (...moreArgs) => f(...moreArgs, ...args);
}
exports.rpartial = rpartial;
/** Performs `action` `times` times. */
function doTimes(times, action) {
    math_1.checkNat(times);
    for (let i = 0; i < times; i++)
        action(i);
}
exports.doTimes = doTimes;
/** Performs some action before returning `value`. */
function returning(value, action) {
    action(value);
    return value;
}
exports.returning = returning;
/** Like `() => value`, but ensures `value` is calculated eagerly. */
function thunk(value) {
    return () => value;
}
exports.thunk = thunk;
/** Like `thunk`, but computes the value on the first access. */
function lazy(f) {
    let value;
    return () => value === undefined ? value = f() : value;
}
exports.lazy = lazy;
function pipe(value, ...functions) {
    for (const f of functions)
        value = f(value);
    return value;
}
exports.pipe = pipe;
/** Function that performs an action before calling a function. */
function before(f, doBefore) {
    return ((...args) => {
        doBefore();
        return f(...args);
    });
}
exports.before = before;
function after(f, doAfter) {
    return ((...args) => {
        const res = f(...args);
        doAfter(res);
        return res;
    });
}
exports.after = after;
/**
Remembers previous calls to a function and does not recompute on the same inputs twice.
The In type must be an object type.
The Out type must not be possibly `undefined`,
as that value is used to indicate that the function hasn't been called yet.
The function type is a type parameter so that intellisense knows the parameter names.
*/
function memoize(f) {
    const cache = new WeakMap();
    const memoized = (input) => {
        const cached = cache.get(input);
        if (option_1.exists(cached))
            return cached;
        else {
            const out = f(input);
            cache.set(input, out);
            return out;
        }
    };
    const m = memoized;
    m.cache = cache;
    return m;
}
exports.memoize = memoize;
/** [[memoize]] for a function with 2 arguments. */
function memoize2(f) {
    const aCache = new WeakMap();
    const memoized = (a, b) => {
        let bCache = aCache.get(a);
        if (!option_1.exists(bCache)) {
            bCache = new WeakMap();
            aCache.set(a, bCache);
        }
        const cached = bCache.get(b);
        if (option_1.exists(cached))
            return cached;
        else {
            const out = f(a, b);
            bCache.set(b, out);
            return out;
        }
    };
    const m = memoized;
    m.cache = aCache;
    return m;
}
exports.memoize2 = memoize2;
//# sourceMappingURL=function.js.map